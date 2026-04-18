import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import {
  ActivitiesController,
  AdminActivitiesController
} from "./activities.controller";
import { ActivityInventoryCacheService } from "./activity-inventory-cache.service";
import { ActivityRegistrationQueueService } from "./activity-registration-queue.service";
import { ActivityRegistrationService } from "./activity-registration.service";
import { ActivitiesService } from "./activities.service";

@Module({
  imports: [AuthModule],
  controllers: [ActivitiesController, AdminActivitiesController],
  providers: [
    ActivitiesService,
    ActivityInventoryCacheService,
    ActivityRegistrationQueueService,
    ActivityRegistrationService
  ],
  exports: [
    ActivityInventoryCacheService,
    ActivityRegistrationQueueService,
    ActivityRegistrationService
  ]
})
export class ActivitiesModule {}
