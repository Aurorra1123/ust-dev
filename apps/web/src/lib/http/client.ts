import type { AuthSessionResponse } from "@campusbook/shared-types";

import { useSessionStore } from "../../store/session-store";
import { buildApiError } from "./errors";

declare global {
  interface Window {
    __CAMPUSBOOK_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  allowRefresh?: boolean;
}

function getRuntimeApiBaseUrl() {
  const runtimeApiBaseUrl = window.__CAMPUSBOOK_CONFIG__?.apiBaseUrl?.trim();

  if (!runtimeApiBaseUrl) {
    return undefined;
  }

  return runtimeApiBaseUrl;
}

function inferDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return "http://api.campusbook.top";
  }

  const { hostname, protocol } = window.location;

  if (hostname === "campusbook.top" || hostname === "www.campusbook.top") {
    return `${protocol}//api.campusbook.top`;
  }

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  ) {
    return "/api";
  }

  return `${window.location.protocol}//api.campusbook.top`;
}

export const API_BASE_URL =
  (typeof window !== "undefined" ? getRuntimeApiBaseUrl() : undefined) ??
  import.meta.env.VITE_API_BASE_URL ??
  inferDefaultApiBaseUrl();

export async function refreshSessionRequest() {
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

export async function requestJson<T>(path: string, options: RequestOptions = {}) {
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
      await refreshSessionRequest();
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
