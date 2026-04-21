import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { AppNotification } from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listPublishedNotifications(): Promise<AppNotification[]> {
    return this.notificationsService.listPublishedNotifications();
  }
}

@Controller("admin/notifications")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listAdminNotifications(): Promise<AppNotification[]> {
    return this.notificationsService.listAdminNotifications();
  }

  @Post()
  createNotification(
    @Body() payload: CreateNotificationDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<AppNotification> {
    return this.notificationsService.createNotification(payload, currentUser);
  }

  @Patch(":id")
  updateNotification(
    @Param("id") id: string,
    @Body() payload: UpdateNotificationDto
  ): Promise<AppNotification> {
    return this.notificationsService.updateNotification(id, payload);
  }
}
