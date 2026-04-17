import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("PostgreSQL connection established");
    } catch (error) {
      this.logger.warn(
        `PostgreSQL connection skipped on startup: ${
          error instanceof Error ? error.message : "unknown-error"
        }`
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async checkHealth() {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: "up" as const,
        detail: "query-ok"
      };
    } catch (error) {
      return {
        status: "down" as const,
        detail: error instanceof Error ? error.message : "unknown-error"
      };
    }
  }
}
