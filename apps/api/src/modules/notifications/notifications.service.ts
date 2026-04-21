import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationStatus as PrismaNotificationStatus } from "@prisma/client";
import type {
  AppNotification,
  AuthUser,
  NotificationStatus
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listPublishedNotifications(): Promise<AppNotification[]> {
    const notifications = await this.prismaService.notification.findMany({
      where: {
        status: PrismaNotificationStatus.PUBLISHED
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    });

    return notifications.map(toAppNotification);
  }

  async listAdminNotifications(): Promise<AppNotification[]> {
    const notifications = await this.prismaService.notification.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });

    return notifications.map(toAppNotification);
  }

  async createNotification(
    payload: CreateNotificationDto,
    currentUser: AuthUser
  ): Promise<AppNotification> {
    const status = payload.status ?? "draft";
    const notification = await this.prismaService.notification.create({
      data: {
        title: payload.title.trim(),
        summary: normalizeOptionalText(payload.summary),
        content: payload.content.trim(),
        status: mapSharedNotificationStatus(status),
        publishedAt: status === "published" ? new Date() : null,
        createdByUserId: currentUser.id
      }
    });

    return toAppNotification(notification);
  }

  async updateNotification(
    id: string,
    payload: UpdateNotificationDto
  ): Promise<AppNotification> {
    const existing = await this.prismaService.notification.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException("notification-not-found");
    }

    const nextStatus = payload.status ?? mapPrismaNotificationStatus(existing.status);
    const shouldPublish =
      nextStatus === "published" &&
      existing.status !== PrismaNotificationStatus.PUBLISHED;

    const notification = await this.prismaService.notification.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
        ...(payload.summary !== undefined
          ? { summary: normalizeOptionalText(payload.summary) }
          : {}),
        ...(payload.content !== undefined ? { content: payload.content.trim() } : {}),
        ...(payload.status !== undefined
          ? {
              status: mapSharedNotificationStatus(payload.status),
              publishedAt:
                payload.status === "published"
                  ? shouldPublish
                    ? new Date()
                    : existing.publishedAt
                  : null
            }
          : {})
      }
    });

    return toAppNotification(notification);
  }
}

function toAppNotification(notification: {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  status: PrismaNotificationStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AppNotification {
  return {
    id: notification.id,
    title: notification.title,
    summary: notification.summary,
    content: notification.content,
    status: mapPrismaNotificationStatus(notification.status),
    publishedAt: notification.publishedAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString()
  };
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapSharedNotificationStatus(value: NotificationStatus) {
  return value === "published"
    ? PrismaNotificationStatus.PUBLISHED
    : PrismaNotificationStatus.DRAFT;
}

function mapPrismaNotificationStatus(value: PrismaNotificationStatus): NotificationStatus {
  return value === PrismaNotificationStatus.PUBLISHED ? "published" : "draft";
}
