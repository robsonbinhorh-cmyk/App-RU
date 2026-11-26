import { useState, useEffect, useCallback, useRef } from "react";
import { ensurePushSubscription, pushSupported, updateSubscriptionPrefs } from "@/lib/pushManager";

export interface NotificationPrefs {
  novoCardapio: boolean;
  dicaDoDia: boolean;
  cardapioDoDia: boolean;
}

const STORAGE_KEY = "ru-ufpe-notification-prefs";

const DEFAULT_PREFS: NotificationPrefs = {
  novoCardapio: true,
  dicaDoDia: false,
  cardapioDoDia: false,
};

function readPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      novoCardapio: parsed.novoCardapio ?? DEFAULT_PREFS.novoCardapio,
      dicaDoDia: parsed.dicaDoDia ?? DEFAULT_PREFS.dicaDoDia,
      cardapioDoDia: parsed.cardapioDoDia ?? DEFAULT_PREFS.cardapioDoDia,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable — non-fatal
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(readPrefs);
  const pushInitiated = useRef(false);
  const prefsRef = useRef<NotificationPrefs>(prefs);

  useEffect(() => {
    prefsRef.current = prefs;
    writePrefs(prefs);
  }, [prefs]);

  // Sync prefs to server-side subscription whenever they change.
  // If no push endpoint is available yet (e.g. SW not registered),
  // ensure the subscription first, then retry the PATCH.
  // AbortController cancels in-flight requests when prefs change again,
  // preventing a stale PATCH/POST from overwriting the newer value.
  useEffect(() => {
    if (!pushSupported()) return;
    const controller = new AbortController();
    (async () => {
      const synced = await updateSubscriptionPrefs(prefs, controller.signal);
      if (!synced && !controller.signal.aborted && getPermissionState() === "granted") {
        // Skip if ensurePush is already handling subscription creation.
        // The mutex in ensurePushSubscription also prevents duplicate
        // subscribe() calls, but skipping here avoids redundant work
        // and prevents a stale POST from overwriting the PATCH that follows.
        if (pushInitiated.current) return;
        await ensurePushSubscription(prefsRef.current, controller.signal);
        await updateSubscriptionPrefs(prefsRef.current, controller.signal);
      }
    })();
    return () => { controller.abort(); };
  }, [prefs]);

  const ensurePush = useCallback(async () => {
    if (!pushSupported()) return;
    // Only skip if a previous attempt already succeeded
    if (pushInitiated.current) return;
    // Read the latest prefs from the ref to avoid sending stale values
    const result = await ensurePushSubscription(prefsRef.current);
    if (result) {
      pushInitiated.current = true;
    }
    // If result is false, pushInitiated stays false so the next toggle can retry
  }, []);

  const toggleNovoCardapio = useCallback(async () => {
    const nextVal = !readPrefs().novoCardapio;
    if (nextVal && getPermissionState() === "default") {
      const result = await requestPermission();
      if (result === "granted") {
        ensurePush();
      }
    } else if (nextVal && getPermissionState() === "granted") {
      ensurePush();
    }
    setPrefs((prev) => ({ ...prev, novoCardapio: nextVal }));
  }, [ensurePush]);

  const toggleDicaDoDia = useCallback(async () => {
    const nextVal = !readPrefs().dicaDoDia;
    if (nextVal && getPermissionState() === "default") {
      const result = await requestPermission();
      if (result === "granted") {
        ensurePush();
      }
    } else if (nextVal && getPermissionState() === "granted") {
      ensurePush();
    }
    setPrefs((prev) => ({ ...prev, dicaDoDia: nextVal }));
  }, [ensurePush]);

  const toggleCardapioDoDia = useCallback(async () => {
    const nextVal = !readPrefs().cardapioDoDia;
    if (nextVal && getPermissionState() === "default") {
      const result = await requestPermission();
      if (result === "granted") {
        ensurePush();
      }
    } else if (nextVal && getPermissionState() === "granted") {
      ensurePush();
    }
    setPrefs((prev) => ({ ...prev, cardapioDoDia: nextVal }));
  }, [ensurePush]);

  return { prefs, toggleNovoCardapio, toggleDicaDoDia, toggleCardapioDoDia };
}
