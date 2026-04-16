import { Controller, Get } from "@nestjs/common";
import type { HealthStatus } from "@campusbook/shared-types";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthStatus {
    return {
      service: "campusbook-api",
      status: "ok",
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres: process.env.DATABASE_URL ? "configured" : "unknown",
        redis: process.env.REDIS_URL ? "configured" : "unknown"
      }
    };
  }
}
