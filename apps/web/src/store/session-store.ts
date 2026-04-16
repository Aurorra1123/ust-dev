import { create } from "zustand";

import type { UserRole } from "@campusbook/shared-types";

interface SessionState {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  role: "student",
  setRole: (role) => set({ role })
}));
