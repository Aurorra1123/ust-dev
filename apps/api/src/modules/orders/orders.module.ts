import { Module } from "@nestjs/common";

import { ActivitiesModule } from "../activities/activities.module";
import { AuthModule } from "../auth/auth.module";
import { OrdersController } from "./orders.controller";
import { OrderExpirationQueueService } from "./order-expiration-queue.service";
import { OrdersService } from "./orders.service";

@Module({
  imports: [AuthModule, ActivitiesModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpirationQueueService],
  exports: [OrderExpirationQueueService, OrdersService]
})
export class OrdersModule {}
