export type UserRole = "student" | "admin";

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "cancelled"
  | "no_show";

export interface HealthStatus {
  service: string;
  status: "ok" | "degraded";
  timestamp: string;
  dependencies: {
    postgres: "up" | "down";
    redis: "up" | "down";
  };
  checks?: {
    postgres?: string;
    redis?: string;
  };
}

export interface AuthUser {
  email: string;
  role: UserRole;
}

export interface AuthSessionResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RouteCard {
  title: string;
  description: string;
  href: string;
  badge: string;
}
