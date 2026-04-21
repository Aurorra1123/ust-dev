import type {
  AppServiceRequest,
  CreateServiceRequestPayload,
  UpdateServiceRequestPayload
} from "@campusbook/shared-types";

import { requestJson } from "../http/client";

export function fetchMyServiceRequests() {
  return requestJson<AppServiceRequest[]>("/service-requests");
}

export function createServiceRequest(payload: CreateServiceRequestPayload) {
  return requestJson<AppServiceRequest>("/service-requests", {
    method: "POST",
    body: payload
  });
}

export function fetchAdminServiceRequests() {
  return requestJson<AppServiceRequest[]>("/admin/service-requests");
}

export function updateServiceRequest(
  requestId: string,
  payload: UpdateServiceRequestPayload
) {
  return requestJson<AppServiceRequest>(`/admin/service-requests/${requestId}`, {
    method: "PATCH",
    body: payload
  });
}
