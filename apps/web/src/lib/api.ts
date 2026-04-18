import type {
  AcademicReservationRequest,
  AcademicReservationResponse,
  ActivityDetailResponse,
  ActivityGrabRequest,
  ActivityGrabResponse,
  ActivityListItem,
  ActivityRegistrationStatusResponse,
  AppRule,
  AuthSessionResponse,
  HealthStatus,
  OrderDetailResponse,
  ResourceDetailResponse,
  ResourceListItem,
  ResourceType,
  RuleExpression,
  RuleStatus,
  RuleType,
  SportsReservationRequest,
  SportsReservationResponse
} from "@campusbook/shared-types";

import { useSessionStore } from "../store/session-store";

function inferDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return "http://api.campusbook.top";
  }

  return `${window.location.protocol}//api.campusbook.top`;
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? inferDefaultApiBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  allowRefresh?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

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

export interface CreateRulePayload {
  name: string;
  ruleType: RuleType;
  status?: RuleStatus;
  expression: RuleExpression;
}

export async function login(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await buildApiError(response);
  }

  const session = (await response.json()) as AuthSessionResponse;
  useSessionStore.getState().setSession(session);
  return session;
}

export async function refreshSession() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    throw await buildApiError(response);
  }

  const session = (await response.json()) as AuthSessionResponse;
  useSessionStore.getState().setSession(session);
  return session;
}

export async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  useSessionStore.getState().clearSession();
}

export function fetchHealthStatus(): Promise<HealthStatus> {
  return requestJson<HealthStatus>("/health", { allowRefresh: false });
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

export function fetchOrders() {
  return requestJson<OrderDetailResponse[]>("/orders");
}

export function fetchOrderDetail(orderId: string) {
  return requestJson<OrderDetailResponse>(`/orders/${orderId}`);
}

export function cancelOrder(orderId: string, reason?: string) {
  return requestJson<OrderDetailResponse>(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: {
      reason
    }
  });
}

export function fetchAdminResources() {
  return requestJson<ResourceDetailResponse[]>("/admin/resources");
}

export function createResource(payload: CreateResourcePayload) {
  return requestJson<ResourceDetailResponse>("/admin/resources", {
    method: "POST",
    body: payload
  });
}

export function createResourceUnit(
  resourceId: string,
  payload: CreateResourceUnitPayload
) {
  return requestJson<ResourceDetailResponse>(
    `/admin/resources/${resourceId}/units`,
    {
      method: "POST",
      body: payload
    }
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

export function fetchAdminRules() {
  return requestJson<AppRule[]>("/admin/rules");
}

export function createRule(payload: CreateRulePayload) {
  return requestJson<AppRule>("/admin/rules", {
    method: "POST",
    body: payload
  });
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, allowRefresh = true } = options;
  const accessToken = useSessionStore.getState().accessToken;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (response.status === 401 && allowRefresh) {
    try {
      await refreshSession();
      return requestJson<T>(path, {
        ...options,
        allowRefresh: false
      });
    } catch {
      useSessionStore.getState().setAnonymous();
    }
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return (await response.json()) as T;
}

async function buildApiError(response: Response) {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const message =
    typeof payload === "object" && payload !== null && "message" in payload
      ? normalizeErrorMessage(
          (payload as { message?: string | string[] }).message
        )
      : response.statusText || `request-failed-${response.status}`;

  return new ApiError(message, response.status, payload);
}

function normalizeErrorMessage(message?: string | string[]) {
  if (Array.isArray(message)) {
    return message.join("；");
  }

  return message ?? "request-failed";
}
