import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "bullmq";
import Redis from "ioredis";

import { createBullmqConnection } from "../../infrastructure/redis/bullmq";
import { OrdersService } from "./orders.service";
import { OrderExpirationQueueService } from "./order-expiration-queue.service";
import {
  ORDER_EXPIRATION_JOB_NAME,
  ORDER_EXPIRATION_QUEUE_NAME,
  type OrderExpirationJobPayload
} from "./order-expiration.constants";

const REHYDRATE_INTERVAL_MS = 60_000;

@Injectable()
export class OrderExpirationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpirationWorkerService.name);
  private readonly connection: Redis;
  private worker?: Worker<OrderExpirationJobPayload>;
  private rehydrateTimer?: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly orderExpirationQueueService: OrderExpirationQueueService
  ) {
    this.connection = createBullmqConnection(
      this.configService.getOrThrow<string>("REDIS_URL")
    );
  }

  async onModuleInit() {
    this.worker = new Worker<OrderExpirationJobPayload>(
      ORDER_EXPIRATION_QUEUE_NAME,
      async (job) => {
        if (job.name !== ORDER_EXPIRATION_JOB_NAME) {
          return null;
        }

        return this.ordersService.expirePendingOrderById(
          job.data.orderId,
          "timeout-cancelled"
        );
      },
      {
        connection: this.connection,
        concurrency: 5
      }
    );

    this.worker.on("completed", (job, result) => {
      this.logger.log(
        `Processed expiration job ${job.id ?? job.name}: ${JSON.stringify(result)}`
      );
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error(
        `Failed expiration job ${job?.id ?? "unknown-job"}`,
        error.stack
      );
    });

    await this.orderExpirationQueueService.rehydratePendingOrders();
    this.rehydrateTimer = setInterval(() => {
      void this.orderExpirationQueueService.rehydratePendingOrders();
    }, REHYDRATE_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.rehydrateTimer) {
      clearInterval(this.rehydrateTimer);
    }

    if (this.worker) {
      await this.worker.close();
    }

    if (this.connection.status !== "end") {
      await this.connection.quit();
    }
  }
}
