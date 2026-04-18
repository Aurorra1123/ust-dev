import { create } from "zustand";

import type { AuthSessionResponse, AuthUser } from "@campusbook/shared-types";

export type SessionStatus = "unknown" | "authenticated" | "anonymous";

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (session: AuthSessionResponse) => void;
  setAnonymous: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "unknown",
  accessToken: null,
  user: null,
  setSession: (session) =>
    set({
      status: "authenticated",
      accessToken: session.accessToken,
      user: session.user
    }),
  setAnonymous: () =>
    set({
      status: "anonymous",
      accessToken: null,
      user: null
    }),
  clearSession: () =>
    set({
      status: "anonymous",
      accessToken: null,
      user: null
    })
}));
