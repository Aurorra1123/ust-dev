import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(this.configService.getOrThrow<string>("REDIS_URL"), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });
  }

  get raw() {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client.status !== "end") {
      await this.client.quit();
    }
  }

  async checkHealth() {
    try {
      if (this.client.status === "wait") {
        await this.client.connect();
      }

      const reply = await this.client.ping();

      return {
        status: reply === "PONG" ? ("up" as const) : ("down" as const),
        detail: reply.toLowerCase()
      };
    } catch (error) {
      this.logger.warn("Redis health check failed");
      return {
        status: "down" as const,
        detail: error instanceof Error ? error.message : "unknown-error"
      };
    }
  }
}
