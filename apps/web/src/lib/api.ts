import type { HealthStatus } from "@campusbook/shared-types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://api.campusbook.top";

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("API health check failed");
  }

  return (await response.json()) as HealthStatus;
}
