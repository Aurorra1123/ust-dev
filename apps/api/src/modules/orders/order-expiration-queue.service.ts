import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OrderStatus } from "@prisma/client";
import { Queue } from "bullmq";
import Redis from "ioredis";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import {
  ORDER_EXPIRATION_JOB_NAME,
  ORDER_EXPIRATION_QUEUE_NAME,
  type OrderExpirationJobPayload
} from "./order-expiration.constants";

const DEFAULT_REHYDRATE_LIMIT = 100;

@Injectable()
export class OrderExpirationQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(OrderExpirationQueueService.name);
  private readonly connection: Redis;
  private readonly queue: Queue<OrderExpirationJobPayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {
    this.connection = createBullmqConnection(
      this.configService.getOrThrow<string>("REDIS_URL")
    );
    this.queue = new Queue<OrderExpirationJobPayload>(
      ORDER_EXPIRATION_QUEUE_NAME,
      {
        connection: this.connection
      }
    );
  }

  async scheduleExpiration(orderId: string, expireAt: Date) {
    const jobId = buildOrderExpirationJobId(orderId);
    const existingJob = await this.queue.getJob(jobId);

    if (existingJob) {
      await existingJob.remove();
    }

    await this.queue.add(
      ORDER_EXPIRATION_JOB_NAME,
      { orderId },
      {
        jobId,
        delay: Math.max(expireAt.getTime() - Date.now(), 0),
        removeOnComplete: 1000,
        removeOnFail: 1000
      }
    );
  }

  async removeExpiration(orderId: string) {
    const job = await this.queue.getJob(buildOrderExpirationJobId(orderId));

    if (job) {
      await job.remove();
    }
  }

  async rehydratePendingOrders(limit = DEFAULT_REHYDRATE_LIMIT) {
    const orders = await this.prismaService.order.findMany({
      where: {
        status: OrderStatus.PENDING_CONFIRMATION,
        expireAt: {
          not: null
        }
      },
      select: {
        id: true,
        expireAt: true
      },
      orderBy: {
        expireAt: "asc"
      },
      take: limit
    });

    let scheduled = 0;

    for (const order of orders) {
      if (!order.expireAt) {
        continue;
      }

      await this.scheduleExpiration(order.id, order.expireAt);
      scheduled += 1;
    }

    this.logger.log(`Rehydrated ${scheduled} pending order expiration jobs`);
    return scheduled;
  }

  async onModuleDestroy() {
    await this.queue.close();
    if (this.connection.status !== "end") {
      await this.connection.quit();
    }
  }
}

export function buildOrderExpirationJobId(orderId: string) {
  return `order-expire-${orderId}`;
}

export function createBullmqConnection(redisUrl: string) {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false
  });
}
