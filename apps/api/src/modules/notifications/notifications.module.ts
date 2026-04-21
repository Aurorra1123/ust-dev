import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import {
  AdminNotificationsController,
  NotificationsController
} from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
