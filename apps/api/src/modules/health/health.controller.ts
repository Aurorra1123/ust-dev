import { Controller, Get } from "@nestjs/common";
import type { HealthStatus } from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService
  ) {}

  @Get()
  async getHealth(): Promise<HealthStatus> {
    const [postgres, redis] = await Promise.all([
      this.prismaService.checkHealth(),
      this.redisService.checkHealth()
    ]);

    return {
      service: "campusbook-api",
      status:
        postgres.status === "up" && redis.status === "up" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres: postgres.status,
        redis: redis.status
      },
      checks: {
        postgres: postgres.detail,
        redis: redis.detail
      }
    };
  }
}
