// RU UFPE — Service Worker for Web Push Notifications
// Scope: "/" (served from site root)
// This SW only handles push events and notification clicks.
// It does NOT intercept fetch requests or cache anything.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "RU UFPE", body: "Você tem uma nova notificação." };

  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed && typeof parsed === "object") {
        if (parsed.title) payload.title = parsed.title;
        if (parsed.body) payload.body = parsed.body;
      }
    }
  } catch {
    // data was not JSON — try plain text
    try {
      if (event.data) {
        const text = event.data.text();
        if (text) payload.body = text;
      }
    } catch {
      // ignore — use default payload
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "ru-ufpe-push",
      data: { url: "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus an existing window if one is already open
      for (const client of allClients) {
        if (client.url.includes(self.location.origin)) {
          if ("focus" in client) {
            await client.focus();
            return;
          }
        }
      }

      // No existing window — open a new one
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
