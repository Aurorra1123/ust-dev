import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  ActivityStatus as PrismaActivityStatus,
  ActivityTicketStatus as PrismaActivityTicketStatus,
  Prisma
} from "@prisma/client";
import type {
  ActivityDetailResponse,
  ActivityListItem,
  ActivityStatus,
  ActivityTicketStatus
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { CreateActivityTicketDto } from "./dto/create-activity-ticket.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";

@Injectable()
export class ActivitiesService {
  constructor(private readonly prismaService: PrismaService) {}

  async listAdminActivities(): Promise<ActivityDetailResponse[]> {
    const activities = await this.prismaService.activity.findMany({
      include: {
        tickets: {
          orderBy: {
            name: "asc"
          }
        }
      },
      orderBy: [{ saleStartTime: "asc" }, { title: "asc" }]
    });

    return activities.map(toActivityDetail);
  }

  async listActivities(): Promise<ActivityListItem[]> {
    const activities = await this.prismaService.activity.findMany({
      where: {
        status: PrismaActivityStatus.PUBLISHED
      },
      include: {
        tickets: {
          where: {
            status: PrismaActivityTicketStatus.ACTIVE
          }
        }
      },
      orderBy: [{ saleStartTime: "asc" }, { title: "asc" }]
    });

    return activities.map((activity) => ({
      ...toActivityBase(activity),
      ticketCount: activity.tickets.length,
      remainingQuota: activity.tickets.reduce(
        (total, ticket) => total + Math.max(ticket.stock - ticket.reserved, 0),
        0
      )
    }));
  }

  async getActivityDetail(id: string): Promise<ActivityDetailResponse> {
    const activity = await this.prismaService.activity.findFirst({
      where: {
        id,
        status: PrismaActivityStatus.PUBLISHED
      },
      include: {
        tickets: {
          orderBy: {
            name: "asc"
          }
        }
      }
    });

    if (!activity) {
      throw new NotFoundException("activity-not-found");
    }

    return toActivityDetail(activity);
  }

  async createActivity(payload: CreateActivityDto): Promise<ActivityDetailResponse> {
    const timeline = normalizeActivityTimeline(payload);

    try {
      const activity = await this.prismaService.activity.create({
        data: {
          title: payload.title,
          description: payload.description,
          location: payload.location,
          totalQuota: payload.totalQuota,
          saleStartTime: timeline.saleStartTime!,
          saleEndTime: timeline.saleEndTime!,
          eventStartTime: timeline.eventStartTime,
          eventEndTime: timeline.eventEndTime,
          status: mapSharedActivityStatus(payload.status ?? "draft"),
          tickets: payload.tickets?.length
            ? {
                create: payload.tickets.map((ticket) => ({
                  name: ticket.name,
                  stock: ticket.stock,
                  priceCents: ticket.priceCents ?? 0,
                  status: mapSharedTicketStatus(ticket.status ?? "active")
                }))
              }
            : undefined
        },
        select: {
          id: true
        }
      });

      return this.getAdminActivityDetail(activity.id);
    } catch (error) {
      handlePrismaConflict(error, "activity-conflict");
      throw error;
    }
  }

  async updateActivity(
    id: string,
    payload: UpdateActivityDto
  ): Promise<ActivityDetailResponse> {
    await this.ensureActivityExists(id);
    const timeline = normalizeActivityTimeline(payload, true);

    try {
      const activity = await this.prismaService.activity.update({
        where: { id },
        data: {
          ...(payload.title ? { title: payload.title } : {}),
          ...(payload.description !== undefined
            ? { description: payload.description }
            : {}),
          ...(payload.location !== undefined ? { location: payload.location } : {}),
          ...(payload.totalQuota ? { totalQuota: payload.totalQuota } : {}),
          ...(timeline.saleStartTime
            ? { saleStartTime: timeline.saleStartTime }
            : {}),
          ...(timeline.saleEndTime ? { saleEndTime: timeline.saleEndTime } : {}),
          ...(timeline.eventStartTime !== undefined
            ? { eventStartTime: timeline.eventStartTime }
            : {}),
          ...(timeline.eventEndTime !== undefined
            ? { eventEndTime: timeline.eventEndTime }
            : {}),
          ...(payload.status
            ? { status: mapSharedActivityStatus(payload.status) }
            : {})
        },
        include: {
          tickets: {
            orderBy: {
              name: "asc"
            }
          }
        }
      });

      return toActivityDetail(activity);
    } catch (error) {
      handlePrismaConflict(error, "activity-conflict");
      throw error;
    }
  }

  async createActivityTicket(
    activityId: string,
    payload: CreateActivityTicketDto
  ): Promise<ActivityDetailResponse> {
    await this.ensureActivityExists(activityId);

    try {
      await this.prismaService.activityTicket.create({
        data: {
          activityId,
          name: payload.name,
          stock: payload.stock,
          priceCents: payload.priceCents ?? 0,
          status: mapSharedTicketStatus(payload.status ?? "active")
        }
      });
    } catch (error) {
      handlePrismaConflict(error, "activity-ticket-conflict");
      throw error;
    }

    return this.getAdminActivityDetail(activityId);
  }

  private async getAdminActivityDetail(id: string) {
    const activity = await this.prismaService.activity.findUnique({
      where: { id },
      include: {
        tickets: {
          orderBy: {
            name: "asc"
          }
        }
      }
    });

    if (!activity) {
      throw new NotFoundException("activity-not-found");
    }

    return toActivityDetail(activity);
  }

  private async ensureActivityExists(id: string) {
    const activity = await this.prismaService.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      throw new NotFoundException("activity-not-found");
    }

    return activity;
  }
}

function toActivityBase(activity: {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  totalQuota: number;
  saleStartTime: Date;
  saleEndTime: Date;
  eventStartTime: Date | null;
  eventEndTime: Date | null;
  status: PrismaActivityStatus;
}) {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    location: activity.location,
    totalQuota: activity.totalQuota,
    saleStartTime: activity.saleStartTime.toISOString(),
    saleEndTime: activity.saleEndTime.toISOString(),
    eventStartTime: activity.eventStartTime?.toISOString() ?? null,
    eventEndTime: activity.eventEndTime?.toISOString() ?? null,
    status: mapPrismaActivityStatus(activity.status)
  };
}

function toActivityDetail(activity: {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  totalQuota: number;
  saleStartTime: Date;
  saleEndTime: Date;
  eventStartTime: Date | null;
  eventEndTime: Date | null;
  status: PrismaActivityStatus;
  tickets: Array<{
    id: string;
    activityId: string;
    name: string;
    stock: number;
    reserved: number;
    priceCents: number;
    status: PrismaActivityTicketStatus;
  }>;
}): ActivityDetailResponse {
  return {
    ...toActivityBase(activity),
    tickets: activity.tickets.map((ticket) => ({
      id: ticket.id,
      activityId: ticket.activityId,
      name: ticket.name,
      stock: ticket.stock,
      reserved: ticket.reserved,
      priceCents: ticket.priceCents,
      status: mapPrismaTicketStatus(ticket.status)
    }))
  };
}

function normalizeActivityTimeline(
  payload: {
    saleStartTime?: string;
    saleEndTime?: string;
    eventStartTime?: string;
    eventEndTime?: string;
  },
  allowPartial = false
) {
  const saleStartTime = payload.saleStartTime
    ? new Date(payload.saleStartTime)
    : undefined;
  const saleEndTime = payload.saleEndTime ? new Date(payload.saleEndTime) : undefined;
  const eventStartTime = payload.eventStartTime
    ? new Date(payload.eventStartTime)
    : payload.eventStartTime === undefined
      ? undefined
      : null;
  const eventEndTime = payload.eventEndTime
    ? new Date(payload.eventEndTime)
    : payload.eventEndTime === undefined
      ? undefined
      : null;

  for (const value of [saleStartTime, saleEndTime, eventStartTime, eventEndTime]) {
    if (value instanceof Date && Number.isNaN(value.getTime())) {
      throw new BadRequestException("invalid-activity-time");
    }
  }

  if (!allowPartial && (!saleStartTime || !saleEndTime)) {
    throw new BadRequestException("missing-sale-time");
  }

  if (saleStartTime && saleEndTime && saleEndTime <= saleStartTime) {
    throw new BadRequestException("sale-end-must-be-after-sale-start");
  }

  if (
    eventStartTime instanceof Date &&
    eventEndTime instanceof Date &&
    eventEndTime <= eventStartTime
  ) {
    throw new BadRequestException("event-end-must-be-after-event-start");
  }

  return {
    saleStartTime,
    saleEndTime,
    eventStartTime,
    eventEndTime
  };
}

function mapSharedActivityStatus(value: ActivityStatus) {
  switch (value) {
    case "draft":
      return PrismaActivityStatus.DRAFT;
    case "published":
      return PrismaActivityStatus.PUBLISHED;
    case "closed":
      return PrismaActivityStatus.CLOSED;
    case "cancelled":
      return PrismaActivityStatus.CANCELLED;
  }
}

function mapPrismaActivityStatus(value: PrismaActivityStatus): ActivityStatus {
  switch (value) {
    case PrismaActivityStatus.DRAFT:
      return "draft";
    case PrismaActivityStatus.PUBLISHED:
      return "published";
    case PrismaActivityStatus.CLOSED:
      return "closed";
    case PrismaActivityStatus.CANCELLED:
      return "cancelled";
  }
}

function mapSharedTicketStatus(value: ActivityTicketStatus) {
  return value === "active"
    ? PrismaActivityTicketStatus.ACTIVE
    : PrismaActivityTicketStatus.INACTIVE;
}

function mapPrismaTicketStatus(
  value: PrismaActivityTicketStatus
): ActivityTicketStatus {
  return value === PrismaActivityTicketStatus.ACTIVE ? "active" : "inactive";
}

function handlePrismaConflict(error: unknown, message: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new ConflictException(message);
  }
}
