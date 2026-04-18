import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import Redis from "ioredis";

import { createBullmqConnection } from "../../infrastructure/redis/bullmq";
import {
  ACTIVITY_REGISTRATION_JOB_NAME,
  ACTIVITY_REGISTRATION_QUEUE_NAME,
  buildActivityRegistrationJobId,
  type ActivityRegistrationJobPayload
} from "./activity-registration.constants";

@Injectable()
export class ActivityRegistrationQueueService implements OnModuleDestroy {
  private readonly connection: Redis;
  private readonly queue: Queue<ActivityRegistrationJobPayload>;

  constructor(private readonly configService: ConfigService) {
    this.connection = createBullmqConnection(
      this.configService.getOrThrow<string>("REDIS_URL")
    );
    this.queue = new Queue<ActivityRegistrationJobPayload>(
      ACTIVITY_REGISTRATION_QUEUE_NAME,
      {
        connection: this.connection
      }
    );
  }

  async enqueueRegistration(payload: ActivityRegistrationJobPayload) {
    const jobId = buildActivityRegistrationJobId(payload);
    const existingJob = await this.queue.getJob(jobId);

    if (existingJob) {
      return jobId;
    }

    await this.queue.add(ACTIVITY_REGISTRATION_JOB_NAME, payload, {
      jobId,
      removeOnComplete: 1000,
      removeOnFail: 1000
    });

    return jobId;
  }

  async onModuleDestroy() {
    await this.queue.close();

    if (this.connection.status !== "end") {
      await this.connection.quit();
    }
  }
}
