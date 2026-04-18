import type { AuthUser, UserRole } from "@campusbook/shared-types";

export type AuthenticatedUser = AuthUser;

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenType: "access" | "refresh";
}
