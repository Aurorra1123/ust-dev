import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "bullmq";
import Redis from "ioredis";

import { createBullmqConnection } from "../../infrastructure/redis/bullmq";
import {
  ACTIVITY_REGISTRATION_JOB_NAME,
  ACTIVITY_REGISTRATION_QUEUE_NAME,
  type ActivityRegistrationJobPayload
} from "./activity-registration.constants";
import { ActivityRegistrationService } from "./activity-registration.service";

@Injectable()
export class ActivityRegistrationWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ActivityRegistrationWorkerService.name);
  private readonly connection: Redis;
  private worker?: Worker<ActivityRegistrationJobPayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly activityRegistrationService: ActivityRegistrationService
  ) {
    this.connection = createBullmqConnection(
      this.configService.getOrThrow<string>("REDIS_URL")
    );
  }

  async onModuleInit() {
    this.worker = new Worker<ActivityRegistrationJobPayload>(
      ACTIVITY_REGISTRATION_QUEUE_NAME,
      async (job) => {
        if (job.name !== ACTIVITY_REGISTRATION_JOB_NAME) {
          return null;
        }

        return this.activityRegistrationService.processQueuedRegistration(
          job.data
        );
      },
      {
        connection: this.connection,
        concurrency: 5
      }
    );

    this.worker.on("completed", (job, result) => {
      this.logger.log(
        `Processed activity registration job ${job.id ?? job.name}: ${JSON.stringify(result)}`
      );
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error(
        `Failed activity registration job ${job?.id ?? "unknown-job"}`,
        error.stack
      );
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }

    if (this.connection.status !== "end") {
      await this.connection.quit();
    }
  }
}
