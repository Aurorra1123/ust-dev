import { Module } from "@nestjs/common";

import { ActivitiesModule } from "../activities/activities.module";
import { AuthModule } from "../auth/auth.module";
import { OrdersController } from "./orders.controller";
import { OrderExpirationQueueService } from "./order-expiration-queue.service";
import { OrdersService } from "./orders.service";
import { ReservationAttendanceQueueService } from "./reservation-attendance-queue.service";

@Module({
  imports: [AuthModule, ActivitiesModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpirationQueueService, ReservationAttendanceQueueService],
  exports: [OrderExpirationQueueService, ReservationAttendanceQueueService, OrdersService]
})
export class OrdersModule {}
