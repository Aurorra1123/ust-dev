import { Module, forwardRef } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { OrdersModule } from "../orders/orders.module";
import { RulesModule } from "../rules/rules.module";
import {
  ActivitiesController,
  AdminActivitiesController
} from "./activities.controller";
import { ActivityInventoryCacheService } from "./activity-inventory-cache.service";
import { ActivityInventoryRecoveryService } from "./activity-inventory-recovery.service";
import { ActivityRegistrationQueueService } from "./activity-registration-queue.service";
import { ActivityRegistrationService } from "./activity-registration.service";
import { ActivitiesService } from "./activities.service";

@Module({
  imports: [AuthModule, forwardRef(() => OrdersModule), RulesModule],
  controllers: [ActivitiesController, AdminActivitiesController],
  providers: [
    ActivitiesService,
    ActivityInventoryCacheService,
    ActivityInventoryRecoveryService,
    ActivityRegistrationQueueService,
    ActivityRegistrationService
  ],
  exports: [
    ActivityInventoryCacheService,
    ActivityInventoryRecoveryService,
    ActivityRegistrationQueueService,
    ActivityRegistrationService
  ]
})
export class ActivitiesModule {}
