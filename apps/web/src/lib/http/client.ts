import type { AuthSessionResponse } from "@campusbook/shared-types";

import { getRuntimeApiBaseUrl as getRuntimeApiBaseUrlFromConfig } from "../runtime-config";
import { useSessionStore } from "../../store/session-store";
import { buildApiError } from "./errors";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  allowRefresh?: boolean;
}

function getRuntimeApiBaseUrl() {
  return typeof window !== "undefined" ? getRuntimeApiBaseUrlFromConfig() : undefined;
}

function getEnvApiBaseUrl() {
  const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!envApiBaseUrl) {
    return undefined;
  }

  return envApiBaseUrl;
}

function inferDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return undefined;
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

  return undefined;
}

export function getApiBaseUrl() {
  const apiBaseUrl =
    getRuntimeApiBaseUrl() ?? getEnvApiBaseUrl() ?? inferDefaultApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error("api-base-url-not-configured");
  }

  return apiBaseUrl;
}

export async function refreshSessionRequest() {
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
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
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
