export type UserRole = "student" | "admin";

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "cancelled"
  | "no_show";

export interface HealthStatus {
  service: string;
  status: "ok";
  timestamp: string;
  dependencies: {
    postgres: "configured" | "unknown";
    redis: "configured" | "unknown";
  };
}

export interface RouteCard {
  title: string;
  description: string;
  href: string;
  badge: string;
}
