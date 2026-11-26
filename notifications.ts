import { notificationsSupported } from "@/hooks/useNotificationPrefs";

export function canNotify(): boolean {
  return notificationsSupported() && Notification.permission === "granted";
}

export function sendNotification(title: string, body: string): void {
  if (!canNotify()) return;
  try {
    new Notification(title, { body });
  } catch {
    // notification creation failed — non-fatal
  }
}
