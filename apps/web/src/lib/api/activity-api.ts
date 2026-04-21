import type {
  ActivityDetailResponse,
  ActivityGrabRequest,
  ActivityGrabResponse,
  ActivityListItem,
  ActivityRegistrationStatusResponse
} from "@campusbook/shared-types";

import { requestJson } from "../http/client";

export interface CreateActivityPayload {
  title: string;
  description?: string;
  location?: string;
  totalQuota: number;
  saleStartTime: string;
  saleEndTime: string;
  eventStartTime?: string;
  eventEndTime?: string;
  status?: "draft" | "published" | "closed" | "cancelled";
  tickets?: Array<{
    name: string;
    stock: number;
    priceCents?: number;
    status?: "active" | "inactive";
  }>;
}

export interface CreateActivityTicketPayload {
  name: string;
  stock: number;
  priceCents?: number;
  status?: "active" | "inactive";
}

export interface UpdateActivityPayload {
  status?: "draft" | "published" | "closed" | "cancelled";
}

export function fetchActivities() {
  return requestJson<ActivityListItem[]>("/activities", {
    allowRefresh: false
  });
}

export function fetchActivityDetail(activityId: string) {
  return requestJson<ActivityDetailResponse>(`/activities/${activityId}`, {
    allowRefresh: false
  });
}

export function grabActivity(activityId: string, payload: ActivityGrabRequest) {
  return requestJson<ActivityGrabResponse>(`/activities/${activityId}/grab`, {
    method: "POST",
    body: payload
  });
}

export function fetchActivityRegistrationStatus(activityId: string) {
  return requestJson<ActivityRegistrationStatusResponse>(
    `/activities/${activityId}/registration-status`
  );
}

export function fetchAdminActivities() {
  return requestJson<ActivityDetailResponse[]>("/admin/activities");
}

export function createActivity(payload: CreateActivityPayload) {
  return requestJson<ActivityDetailResponse>("/admin/activities", {
    method: "POST",
    body: payload
  });
}

export function updateActivity(activityId: string, payload: UpdateActivityPayload) {
  return requestJson<ActivityDetailResponse>(`/admin/activities/${activityId}`, {
    method: "PATCH",
    body: payload
  });
}

export function createActivityTicket(
  activityId: string,
  payload: CreateActivityTicketPayload
) {
  return requestJson<ActivityDetailResponse>(
    `/admin/activities/${activityId}/tickets`,
    {
      method: "POST",
      body: payload
    }
  );
}
