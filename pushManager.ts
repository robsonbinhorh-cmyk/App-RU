/**
 * Client-side Web Push subscription manager.
 *
 * Handles service worker registration, VAPID key conversion,
 * PushSubscription creation/retrieval, backend sync, and preference updates.
 *
 * The VAPID private key is NEVER used or referenced here.
 * Only the public key (from VITE_VAPID_PUBLIC_KEY) is used client-side.
 */

import type { NotificationPrefs } from "@/hooks/useNotificationPrefs";

const SW_PATH = "/sw.js";

const LOG_PREFIX = "[RU UFPE Push]";

function log(stage: string, message: string): void {
  console.log(`${LOG_PREFIX} ${stage}: ${message}`);
}

function logError(stage: string, message: string, error?: unknown): void {
  if (error instanceof Error) {
    console.error(`${LOG_PREFIX} ${stage}: ${message}`, error.name, error.message);
  } else {
    console.error(`${LOG_PREFIX} ${stage}: ${message}`);
  }
}

function getVapidPublicKey(): string {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
}

function getEdgeFunctionUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  return `${supabaseUrl}/functions/v1/push-subscription`;
}

function getAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY as string;
}

function prefsToServerFormat(prefs: NotificationPrefs) {
  return {
    novoCardapio: prefs.novoCardapio,
    dicaDoDia: prefs.dicaDoDia,
    cardapioDoDia: prefs.cardapioDoDia,
  };
}

/**
 * Returns true if the current browser supports all three
 * requirements: Service Worker, Push API, and Notifications API.
 */
export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Converts a base64url VAPID public key into a Uint8Array,
 * as required by pushManager.subscribe().
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

/**
 * Registers the service worker at root scope.
 * Returns the registration or null if unsupported / failed.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    return reg;
  } catch (error) {
    logError("SERVICE_WORKER", "Registration failed", error);
    return null;
  }
}

/**
 * Gets the existing PushSubscription for the given registration,
 * or null if none exists.
 */
export async function getExistingSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    return await registration.pushManager.getSubscription();
  } catch (error) {
    logError("PUSH_SUBSCRIBE", "Failed to check existing subscription", error);
    return null;
  }
}

/**
 * Returns the current push subscription endpoint, or null if no subscription exists.
 */
export async function getPushEndpoint(): Promise<string | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return null;
    const sub = await getExistingSubscription(reg);
    return sub?.endpoint ?? null;
  } catch {
    return null;
  }
}

/**
 * Creates a new PushSubscription using the VAPID public key.
 * Returns the subscription or null on failure.
 */
export async function createPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    logError("VAPID", "VITE_VAPID_PUBLIC_KEY is missing or empty");
    return null;
  }

  try {
    const existing = await getExistingSubscription(registration);
    if (existing) {
      log("PUSH_SUBSCRIBE", "Existing subscription found — reusing it");
      return existing;
    }

    log("PUSH_SUBSCRIBE", "No existing subscription — calling PushManager.subscribe()");
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    log("PUSH_SUBSCRIBE", "PushSubscription created successfully");
    return sub;
  } catch (error) {
    logError("PUSH_SUBSCRIBE", "PushManager.subscribe() threw an error", error);
    return null;
  }
}

/**
 * Sends (or updates) the PushSubscription to the backend Edge Function.
 * Returns true on success, false on failure.
 */
export async function sendSubscriptionToServer(
  subscription: PushSubscription,
  prefs?: NotificationPrefs,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const sub = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      expirationTime: number | null;
    };

    log("BACKEND_REQUEST", "Sending subscription to push-subscription Edge Function");

    const response = await fetch(getEdgeFunctionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAnonKey()}`,
      },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys?.p256dh,
          auth: sub.keys?.auth,
        },
        expirationTime: sub.expirationTime ?? null,
        prefs: prefs ? prefsToServerFormat(prefs) : undefined,
      }),
      signal,
    });

    if (response.ok) {
      log("BACKEND_RESPONSE", `Success — HTTP ${response.status}`);
      return true;
    }

    let errorBody = "";
    try {
      const body = await response.json();
      errorBody = body?.error || JSON.stringify(body);
    } catch {
      errorBody = await response.text().catch(() => "");
    }
    logError("BACKEND_RESPONSE", `Failed — HTTP ${response.status}: ${errorBody}`);
    return false;
  } catch (error) {
    logError("BACKEND_REQUEST", "Network error sending subscription to backend", error);
    return false;
  }
}

/**
 * Updates notification preferences for an existing subscription on the server.
 * Returns true if the PATCH was sent successfully, false if no subscription
 * endpoint was available or the request failed.
 */
export async function updateSubscriptionPrefs(prefs: NotificationPrefs, signal?: AbortSignal): Promise<boolean> {
  try {
    const endpoint = await getPushEndpoint();
    if (!endpoint) {
      logError("PREF_SYNC", "No push endpoint found — cannot sync preferences");
      return false;
    }

    const response = await fetch(getEdgeFunctionUrl(), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAnonKey()}`,
      },
      body: JSON.stringify({
        endpoint,
        prefs: prefsToServerFormat(prefs),
      }),
      signal,
    });

    if (!response.ok) {
      let errorBody = "";
      try {
        const body = await response.json();
        errorBody = body?.error || JSON.stringify(body);
      } catch {
        errorBody = await response.text().catch(() => "");
      }
      logError("PREF_SYNC", `PATCH failed — HTTP ${response.status}: ${errorBody}`);
      return false;
    }

    log("PREF_SYNC", "Preferences synced to server successfully");
    return true;
  } catch (error) {
    logError("PREF_SYNC", "Network error syncing preferences", error);
    return false;
  }
}

/**
 * Removes the PushSubscription both locally (browser) and on the backend.
 * Returns true if the local unsubscribe succeeded.
 */
export async function removePushSubscription(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const sub = await getExistingSubscription(registration);
    if (!sub) return true;

    const endpoint = sub.endpoint;

    await sub.unsubscribe();

    try {
      await fetch(getEdgeFunctionUrl(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAnonKey()}`,
        },
        body: JSON.stringify({ endpoint }),
      });
    } catch {
      // ignore
    }

    return true;
  } catch {
    return false;
  }
}

let inFlightSubscription: Promise<boolean> | null = null;

/**
 * Full subscription flow: check prerequisites → register SW → wait for ready →
 * subscribe → sync to backend.
 * Returns true if a subscription was created or already exists and synced.
 *
 * Concurrent callers share the same in-flight promise so that only one
 * PushManager.subscribe() operation runs at a time.
 */
export async function ensurePushSubscription(prefs?: NotificationPrefs, signal?: AbortSignal): Promise<boolean> {
  if (inFlightSubscription) {
    return inFlightSubscription;
  }

  const promise = doEnsurePushSubscription(prefs, signal);
  inFlightSubscription = promise;
  try {
    return await promise;
  } finally {
    inFlightSubscription = null;
  }
}

async function doEnsurePushSubscription(prefs?: NotificationPrefs, signal?: AbortSignal): Promise<boolean> {
  // PUSH_SUPPORT check
  if (!pushSupported()) {
    const missing: string[] = [];
    if (typeof window === "undefined") missing.push("window");
    if (!("serviceWorker" in navigator)) missing.push("serviceWorker");
    if (!("PushManager" in window)) missing.push("PushManager");
    if (!("Notification" in window)) missing.push("Notification");
    logError("PUSH_SUPPORT", `Not supported — missing: ${missing.join(", ")}`);
    return false;
  }

  // PERMISSION check
  if (Notification.permission !== "granted") {
    logError("PERMISSION", `Notification permission is "${Notification.permission}" — expected "granted"`);
    return false;
  }

  // VAPID check
  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    logError("VAPID", "VITE_VAPID_PUBLIC_KEY is missing or empty in build environment");
    return false;
  }

  // SERVICE_WORKER — register (idempotent) then wait for ready
  const registration = await registerServiceWorker();
  if (!registration) {
    logError("SERVICE_WORKER", "Registration returned null");
    return false;
  }

  let readyRegistration: ServiceWorkerRegistration;
  try {
    log("SERVICE_WORKER", "Waiting for navigator.serviceWorker.ready...");
    readyRegistration = await navigator.serviceWorker.ready;
    log("SERVICE_WORKER", "Service Worker is ready");
  } catch (error) {
    logError("SERVICE_WORKER", "navigator.serviceWorker.ready rejected", error);
    return false;
  }

  // PUSH_SUBSCRIBE
  const sub = await createPushSubscription(readyRegistration);
  if (!sub) {
    logError("PUSH_SUBSCRIBE", "No subscription obtained — see prior error for details");
    return false;
  }

  // BACKEND_REQUEST + BACKEND_RESPONSE
  return sendSubscriptionToServer(sub, prefs, signal);
}
