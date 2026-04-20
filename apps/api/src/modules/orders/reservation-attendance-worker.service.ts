import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "bullmq";
import Redis from "ioredis";

import { createBullmqConnection } from "../../infrastructure/redis/bullmq";
import { OrdersService } from "./orders.service";
import { ReservationAttendanceQueueService } from "./reservation-attendance-queue.service";
import {
  RESERVATION_ATTENDANCE_JOB_NAME,
  RESERVATION_ATTENDANCE_QUEUE_NAME,
  type ReservationAttendanceJobPayload
} from "./reservation-attendance.constants";

const REHYDRATE_INTERVAL_MS = 60_000;

@Injectable()
export class ReservationAttendanceWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ReservationAttendanceWorkerService.name);
  private readonly connection: Redis;
  private worker?: Worker<ReservationAttendanceJobPayload>;
  private rehydrateTimer?: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly reservationAttendanceQueueService: ReservationAttendanceQueueService
  ) {
    this.connection = createBullmqConnection(
      this.configService.getOrThrow<string>("REDIS_URL")
    );
  }

  async onModuleInit() {
    this.worker = new Worker<ReservationAttendanceJobPayload>(
      RESERVATION_ATTENDANCE_QUEUE_NAME,
      async (job) => {
        if (job.name !== RESERVATION_ATTENDANCE_JOB_NAME) {
          return null;
        }

        return this.ordersService.finalizeReservationAttendance(job.data.orderId);
      },
      {
        connection: this.connection,
        concurrency: 5
      }
    );

    this.worker.on("completed", (job, result) => {
      this.logger.log(
        `Processed reservation attendance job ${job.id ?? job.name}: ${JSON.stringify(result)}`
      );
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error(
        `Failed reservation attendance job ${job?.id ?? "unknown-job"}`,
        error.stack
      );
    });

    await this.reservationAttendanceQueueService.rehydrateReservationAttendances();
    this.rehydrateTimer = setInterval(() => {
      void this.reservationAttendanceQueueService.rehydrateReservationAttendances();
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
