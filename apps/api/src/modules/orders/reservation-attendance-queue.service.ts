import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OrderBizType, OrderStatus } from "@prisma/client";
import { Queue } from "bullmq";
import Redis from "ioredis";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { createBullmqConnection } from "../../infrastructure/redis/bullmq";
import {
  RESERVATION_ATTENDANCE_JOB_NAME,
  RESERVATION_ATTENDANCE_QUEUE_NAME,
  type ReservationAttendanceJobPayload
} from "./reservation-attendance.constants";

const DEFAULT_REHYDRATE_LIMIT = 100;
const CHECK_IN_WINDOW_MINUTES = 10;

@Injectable()
export class ReservationAttendanceQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(ReservationAttendanceQueueService.name);
  private readonly connection: Redis;
  private readonly queue: Queue<ReservationAttendanceJobPayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {
    this.connection = createBullmqConnection(
      this.configService.getOrThrow<string>("REDIS_URL")
    );
    this.queue = new Queue<ReservationAttendanceJobPayload>(
      RESERVATION_ATTENDANCE_QUEUE_NAME,
      {
        connection: this.connection
      }
    );
  }

  async scheduleAttendanceEvaluation(orderId: string, evaluateAt: Date) {
    const jobId = buildReservationAttendanceJobId(orderId);
    const existingJob = await this.queue.getJob(jobId);

    if (existingJob) {
      await existingJob.remove();
    }

    await this.queue.add(
      RESERVATION_ATTENDANCE_JOB_NAME,
      { orderId },
      {
        jobId,
        delay: Math.max(evaluateAt.getTime() - Date.now(), 0),
        removeOnComplete: 1000,
        removeOnFail: 1000
      }
    );
  }

  async removeAttendanceEvaluation(orderId: string) {
    const job = await this.queue.getJob(buildReservationAttendanceJobId(orderId));

    if (job) {
      await job.remove();
    }
  }

  async rehydrateReservationAttendances(limit = DEFAULT_REHYDRATE_LIMIT) {
    const orders = await this.prismaService.order.findMany({
      where: {
        bizType: OrderBizType.RESOURCE_RESERVATION,
        status: OrderStatus.CONFIRMED,
        OR: [
          {
            academicReservation: {
              isNot: null
            }
          },
          {
            sportsReservationSlots: {
              some: {}
            }
          }
        ]
      },
      select: {
        id: true,
        academicReservation: {
          select: {
            startTime: true
          }
        },
        sportsReservationSlots: {
          select: {
            slotStart: true
          },
          orderBy: {
            slotStart: "asc"
          },
          take: 1
        }
      },
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    });

    let scheduled = 0;

    for (const order of orders) {
      const reservationStart =
        order.academicReservation?.startTime ??
        order.sportsReservationSlots[0]?.slotStart;

      if (!reservationStart) {
        continue;
      }

      await this.scheduleAttendanceEvaluation(
        order.id,
        addMinutes(reservationStart, CHECK_IN_WINDOW_MINUTES)
      );
      scheduled += 1;
    }

    this.logger.log(`Rehydrated ${scheduled} reservation attendance jobs`);
    return scheduled;
  }

  async onModuleDestroy() {
    await this.queue.close();
    if (this.connection.status !== "end") {
      await this.connection.quit();
    }
  }
}

export function buildReservationAttendanceJobId(orderId: string) {
  return `reservation-attendance-${orderId}`;
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}
