import type {
  AcademicReservationRequest,
  AcademicReservationResponse,
  AdminBulkMutationResponse,
  AdminResourceDetailResponse,
  AdminResourceReservationStatusResponse,
  CreateResourceBookingClosurePayload,
  CreateResourceReleaseRulePayload,
  PublicResourceReservationStatusResponse,
  ResourceDetailResponse,
  ResourceListItem,
  ResourceType,
  SportsReservationRequest,
  SportsReservationResponse,
  UpdateResourceBookingClosurePayload,
  UpdateResourceReleaseRulePayload
} from "@campusbook/shared-types";

import { requestJson } from "../http/client";

export interface CreateResourcePayload {
  type: ResourceType;
  code: string;
  name: string;
  description?: string;
  location?: string;
  status?: "active" | "inactive";
}

export interface CreateResourceUnitPayload {
  code: string;
  name: string;
  unitType: string;
  availabilityMode: "continuous" | "discrete_slot";
  capacity?: number;
  sortOrder?: number;
}

export interface UpdateResourceUnitPayload {
  code?: string;
  name?: string;
  unitType?: string;
  availabilityMode?: "continuous" | "discrete_slot";
  capacity?: number;
  sortOrder?: number;
}

export function fetchResources(type?: ResourceType) {
  const suffix = type ? `?type=${type}` : "";
  return requestJson<ResourceListItem[]>(`/resources${suffix}`, {
    allowRefresh: false
  });
}

export function fetchResourceDetail(resourceId: string) {
  return requestJson<ResourceDetailResponse>(`/resources/${resourceId}`, {
    allowRefresh: false
  });
}

export function fetchResourceReservationStatus(
  resourceId: string,
  params?: { from?: string; to?: string }
) {
  return requestJson<PublicResourceReservationStatusResponse>(
    `/resources/${resourceId}/reservation-status${buildWindowQuerySuffix(params)}`,
    {
      allowRefresh: false
    }
  );
}

export function createAcademicReservation(payload: AcademicReservationRequest) {
  return requestJson<AcademicReservationResponse>("/reservations/academic", {
    method: "POST",
    body: payload
  });
}

export function createSportsReservation(payload: SportsReservationRequest) {
  return requestJson<SportsReservationResponse>("/reservations/sports", {
    method: "POST",
    body: payload
  });
}

export function fetchAdminResources() {
  return requestJson<AdminResourceDetailResponse[]>("/admin/resources");
}

export function createResource(payload: CreateResourcePayload) {
  return requestJson<AdminResourceDetailResponse>("/admin/resources", {
    method: "POST",
    body: payload
  });
}

export function updateResource(
  resourceId: string,
  payload: Partial<CreateResourcePayload>
) {
  return requestJson<AdminResourceDetailResponse>(`/admin/resources/${resourceId}`, {
    method: "PATCH",
    body: payload
  });
}

export function createResourceUnit(
  resourceId: string,
  payload: CreateResourceUnitPayload
) {
  return requestJson<AdminResourceDetailResponse>(
    `/admin/resources/${resourceId}/units`,
    {
      method: "POST",
      body: payload
    }
  );
}

export function updateResourceUnit(
  resourceId: string,
  unitId: string,
  payload: UpdateResourceUnitPayload
) {
  return requestJson<AdminResourceDetailResponse>(
    `/admin/resources/${resourceId}/units/${unitId}`,
    {
      method: "PATCH",
      body: payload
    }
  );
}

export function deleteResource(resourceId: string) {
  return requestJson<{ id: string }>(`/admin/resources/${resourceId}`, {
    method: "DELETE"
  });
}

export function deleteResourceUnit(resourceId: string, unitId: string) {
  return requestJson<AdminResourceDetailResponse>(
    `/admin/resources/${resourceId}/units/${unitId}`,
    {
      method: "DELETE"
    }
  );
}

export function createResourceReleaseRules(
  payload: CreateResourceReleaseRulePayload
) {
  return requestJson<AdminBulkMutationResponse>("/admin/resources/release-rules", {
    method: "POST",
    body: payload
  });
}

export function updateResourceReleaseRule(
  ruleId: string,
  payload: UpdateResourceReleaseRulePayload
) {
  return requestJson(`/admin/resources/release-rules/${ruleId}`, {
    method: "PATCH",
    body: payload
  });
}

export function createResourceBookingClosures(
  payload: CreateResourceBookingClosurePayload
) {
  return requestJson<AdminBulkMutationResponse>("/admin/resources/closures", {
    method: "POST",
    body: payload
  });
}

export function updateResourceBookingClosure(
  closureId: string,
  payload: UpdateResourceBookingClosurePayload
) {
  return requestJson(`/admin/resources/closures/${closureId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteResourceBookingClosure(closureId: string) {
  return requestJson<{ id: string }>(`/admin/resources/closures/${closureId}`, {
    method: "DELETE"
  });
}

export function fetchAdminResourceReservationStatus(
  resourceId: string,
  params?: { from?: string; to?: string }
) {
  return requestJson<AdminResourceReservationStatusResponse>(
    `/admin/resources/${resourceId}/reservation-status${buildWindowQuerySuffix(params)}`
  );
}

function buildWindowQuerySuffix(params?: { from?: string; to?: string }) {
  const query = new URLSearchParams();

  if (params?.from) {
    query.set("from", params.from);
  }

  if (params?.to) {
    query.set("to", params.to);
  }

  return query.size ? `?${query.toString()}` : "";
}
