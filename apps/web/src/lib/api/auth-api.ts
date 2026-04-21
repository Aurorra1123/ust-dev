import type { AuthSessionResponse } from "@campusbook/shared-types";

import { useSessionStore } from "../../store/session-store";
import { API_BASE_URL, refreshSessionRequest, requestJson } from "../http/client";

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload) {
  const session = await requestJson<AuthSessionResponse>("/auth/login", {
    method: "POST",
    body: payload,
    allowRefresh: false
  });

  useSessionStore.getState().setSession(session);
  return session;
}

export function refreshSession() {
  return refreshSessionRequest();
}

export async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  useSessionStore.getState().clearSession();
}
