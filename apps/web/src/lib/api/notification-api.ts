import type {
  AppNotification,
  CreateNotificationPayload,
  UpdateNotificationPayload
} from "@campusbook/shared-types";

import { requestJson } from "../http/client";

export function fetchPublishedNotifications() {
  return requestJson<AppNotification[]>("/notifications", {
    allowRefresh: false
  });
}

export function fetchAdminNotifications() {
  return requestJson<AppNotification[]>("/admin/notifications");
}

export function createNotification(payload: CreateNotificationPayload) {
  return requestJson<AppNotification>("/admin/notifications", {
    method: "POST",
    body: payload
  });
}

export function updateNotification(
  notificationId: string,
  payload: UpdateNotificationPayload
) {
  return requestJson<AppNotification>(`/admin/notifications/${notificationId}`, {
    method: "PATCH",
    body: payload
  });
}
