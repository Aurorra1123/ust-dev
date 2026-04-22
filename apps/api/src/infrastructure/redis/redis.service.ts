import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { closeRedisConnection } from "./close-redis-connection";

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

  async connect() {
    if (this.client.status === "ready") {
      return this.client;
    }

    if (this.client.status === "wait") {
      await this.client.connect();
    }

    await waitForReady(this.client);

    return this.client;
  }

  async onModuleDestroy() {
    await closeRedisConnection(this.client);
  }

  async checkHealth() {
    try {
      const reply = await (await this.connect()).ping();

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

async function waitForReady(client: Redis) {
  if (client.status === "ready") {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      client.off("ready", handleReady);
      client.off("error", handleError);
      client.off("end", handleEnd);
      client.off("close", handleClose);
    };

    const handleReady = () => {
      cleanup();
      resolve();
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const handleEnd = () => {
      cleanup();
      reject(new Error("redis-connection-ended-before-ready"));
    };

    const handleClose = () => {
      cleanup();
      reject(new Error("redis-connection-closed-before-ready"));
    };

    client.once("ready", handleReady);
    client.once("error", handleError);
    client.once("end", handleEnd);
    client.once("close", handleClose);
  });
}
