import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import {
  OrderBizType,
  OrderStatus,
  ReservationCategory,
  ResourceAvailabilityMode,
  ResourceType,
  UserStatus
} from "@prisma/client";
import type {
  AcademicReservationRequest,
  AcademicReservationResponse,
  ReservationCheckInResponse,
  SportsReservationRequest,
  SportsReservationResponse
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ReservationAttendanceQueueService } from "../orders/reservation-attendance-queue.service";
import { getResourceChannelBlock } from "../resource/resource-channel";
import { RulesService } from "../rules/rules.service";

const ACADEMIC_BUFFER_MINUTES = 5;
const CHECK_IN_WINDOW_MINUTES = 10;
const RESERVATION_BAN_DAYS = 7;
const SPORTS_SLOT_MINUTES = 60;

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly reservationAttendanceQueueService: ReservationAttendanceQueueService,
    private readonly rulesService: RulesService
  ) {}

  async createAcademicReservation(
    payload: AcademicReservationRequest,
    currentUser: AuthenticatedUser
  ): Promise<AcademicReservationResponse> {
    const user = await this.getActiveReservationUser(currentUser.id);
    const companionUsers = (await this.resolveCompanionUsers(payload.companionEmails)).filter(
      (companion) => companion.id !== user.id
    );
    const startTime = new Date(payload.startTime);
    const endTime = new Date(payload.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException("invalid-reservation-time");
    }

    if (endTime <= startTime) {
      throw new BadRequestException("reservation-end-must-be-after-start");
    }

    const resourceUnit = await this.prismaService.resourceUnit.findUnique({
      where: { id: payload.resourceUnitId },
      include: {
        resource: {
          include: {
            releaseRules: true,
            bookingClosures: true
          }
        }
      }
    });

    if (!resourceUnit) {
      throw new NotFoundException("resource-unit-not-found");
    }

    if (resourceUnit.resource.type !== ResourceType.ACADEMIC_SPACE) {
      throw new BadRequestException("resource-unit-is-not-academic-space");
    }

    this.assertResourceChannelOpen(
      resourceUnit.resource,
      startTime,
      endTime
    );

    await this.assertReservationCategoryAvailable(
      [user, ...companionUsers],
      ReservationCategory.ACADEMIC_SPACE
    );

    await this.rulesService.assertReservationRules({
      resourceId: resourceUnit.resourceId,
      userId: user.id,
      requestedDurationMinutes: Math.ceil(
        (endTime.getTime() - startTime.getTime()) / (60 * 1000)
      )
    });

    const existingConflict =
      await this.prismaService.academicReservation.findFirst({
        where: {
          resourceUnitId: resourceUnit.id,
          status: {
            in: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED]
          },
          startTime: {
            lt: addMinutes(endTime, ACADEMIC_BUFFER_MINUTES)
          },
          endTime: {
            gt: addMinutes(startTime, -ACADEMIC_BUFFER_MINUTES)
          }
        },
        select: {
          id: true
        }
      });

    if (existingConflict) {
      throw new ConflictException("academic-reservation-conflict");
    }

    try {
      const created = await this.prismaService.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: user.id,
            bizType: OrderBizType.RESOURCE_RESERVATION,
            status: OrderStatus.CONFIRMED,
            totalAmountCents: 0,
            items: {
              create: {
                resourceId: resourceUnit.resourceId,
                resourceUnitId: resourceUnit.id,
                startTime,
                endTime,
                quantity: 1,
                slotCount: 1,
                bufferBeforeMin: ACADEMIC_BUFFER_MINUTES,
                bufferAfterMin: ACADEMIC_BUFFER_MINUTES
              }
            },
            statusLogs: {
              create: {
                toStatus: OrderStatus.CONFIRMED,
                reason: "academic-reservation-created"
              }
            }
          }
        });

        const reservation = await tx.academicReservation.create({
          data: {
            orderId: order.id,
            userId: user.id,
            resourceId: resourceUnit.resourceId,
            resourceUnitId: resourceUnit.id,
            startTime,
            endTime,
            bufferBeforeMin: ACADEMIC_BUFFER_MINUTES,
            bufferAfterMin: ACADEMIC_BUFFER_MINUTES,
            status: OrderStatus.CONFIRMED
          }
        });

        await tx.reservationParticipant.createMany({
          data: [
            {
              orderId: order.id,
              userId: user.id,
              isHost: true
            },
            ...companionUsers.map((companion) => ({
              orderId: order.id,
              userId: companion.id,
              isHost: false
            }))
          ]
        });

        return {
          response: {
            reservationId: reservation.id,
            orderId: order.id,
            orderNo: order.orderNo,
            userId: user.id,
            resourceId: reservation.resourceId,
            resourceUnitId: reservation.resourceUnitId,
            startTime: reservation.startTime.toISOString(),
            endTime: reservation.endTime.toISOString(),
            bufferBeforeMin: reservation.bufferBeforeMin,
            bufferAfterMin: reservation.bufferAfterMin,
            status: "confirmed" as const
          }
        };
      });

      await this.scheduleAttendanceEvaluation(created.response.orderId, startTime);
      return created.response;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("academic_reservation_no_overlap")
      ) {
        throw new ConflictException("academic-reservation-conflict");
      }

      throw error;
    }
  }

  async createSportsReservation(
    payload: SportsReservationRequest,
    currentUser: AuthenticatedUser
  ): Promise<SportsReservationResponse> {
    const user = await this.getActiveReservationUser(currentUser.id);
    const companionUsers = (await this.resolveCompanionUsers(payload.companionEmails)).filter(
      (companion) => companion.id !== user.id
    );
    const hasUnit = Boolean(payload.resourceUnitId);
    const hasGroup = Boolean(payload.resourceGroupId);

    if (hasUnit === hasGroup) {
      throw new BadRequestException(
        "provide-exactly-one-of-resourceUnitId-or-resourceGroupId"
      );
    }

    const normalizedSlots = normalizeSportsSlots(payload.slotStarts);

    const reservationTarget = hasUnit
      ? await this.prismaService.resourceUnit.findUnique({
          where: { id: payload.resourceUnitId },
          include: {
            resource: {
              include: {
                releaseRules: true,
                bookingClosures: true
              }
            }
          }
        })
      : null;

    const reservationGroup = hasGroup
      ? await this.prismaService.resourceGroup.findUnique({
          where: { id: payload.resourceGroupId },
        include: {
            resource: {
              include: {
                releaseRules: true,
                bookingClosures: true
              }
            },
            items: {
              include: {
                resourceUnit: {
                  include: {
                    resource: true
                  }
                }
              },
              orderBy: {
                sortOrder: "asc"
              }
            }
          }
        })
      : null;

    if (hasUnit && !reservationTarget) {
      throw new NotFoundException("resource-unit-not-found");
    }

    if (hasGroup && !reservationGroup) {
      throw new NotFoundException("resource-group-not-found");
    }

    const resourceUnits = hasUnit
      ? [reservationTarget!]
      : reservationGroup!.items.map((item) => item.resourceUnit);

    if (resourceUnits.length === 0) {
      throw new BadRequestException("resource-group-is-empty");
    }

    const parentResource = hasUnit
      ? reservationTarget!.resource
      : reservationGroup!.resource;

    if (parentResource.type !== ResourceType.SPORTS_FACILITY) {
      throw new BadRequestException("reservation-target-is-not-sports-facility");
    }

    const firstSlotStart = normalizedSlots[0]!.start;
    const lastSlotEnd = normalizedSlots[normalizedSlots.length - 1]!.end;

    this.assertResourceChannelOpen(parentResource, firstSlotStart, lastSlotEnd);

    await this.assertReservationCategoryAvailable(
      [user, ...companionUsers],
      ReservationCategory.SPORTS_FACILITY
    );

    for (const unit of resourceUnits) {
      if (unit.resource.type !== ResourceType.SPORTS_FACILITY) {
        throw new BadRequestException("resource-unit-is-not-sports-facility");
      }

      if (unit.availabilityMode !== ResourceAvailabilityMode.DISCRETE_SLOT) {
        throw new BadRequestException("resource-unit-is-not-slot-based");
      }
    }

    await this.rulesService.assertReservationRules({
      resourceId: parentResource.id,
      userId: user.id,
      requestedDurationMinutes: normalizedSlots.length * SPORTS_SLOT_MINUTES
    });

    const existingConflict =
      await this.prismaService.sportsReservationSlot.findFirst({
        where: {
          resourceUnitId: {
            in: resourceUnits.map((unit) => unit.id)
          },
          slotStart: {
            in: normalizedSlots.map((slot) => slot.start)
          },
          status: {
            in: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED]
          }
        },
        select: {
          id: true
        }
      });

    if (existingConflict) {
      throw new ConflictException("sports-reservation-conflict");
    }

    try {
      const created = await this.prismaService.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: user.id,
            bizType: OrderBizType.RESOURCE_RESERVATION,
            status: OrderStatus.CONFIRMED,
            totalAmountCents: 0
          }
        });

        const orderItems = resourceUnits.flatMap((unit) =>
          normalizedSlots.map((slot) => ({
            orderId: order.id,
            resourceId: unit.resourceId,
            resourceUnitId: unit.id,
            startTime: slot.start,
            endTime: slot.end,
            quantity: 1,
            slotCount: 1,
            bufferBeforeMin: 0,
            bufferAfterMin: 0
          }))
        );

        const sportsSlots = resourceUnits.flatMap((unit) =>
          normalizedSlots.map((slot) => ({
            orderId: order.id,
            userId: user.id,
            resourceId: unit.resourceId,
            resourceUnitId: unit.id,
            slotStart: slot.start,
            slotEnd: slot.end,
            status: OrderStatus.CONFIRMED
          }))
        );

        await tx.orderItem.createMany({
          data: orderItems
        });

        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            toStatus: OrderStatus.CONFIRMED,
            reason: hasGroup
              ? "sports-group-reservation-created"
              : "sports-reservation-created"
          }
        });

        await tx.sportsReservationSlot.createMany({
          data: sportsSlots
        });

        await tx.reservationParticipant.createMany({
          data: [
            {
              orderId: order.id,
              userId: user.id,
              isHost: true
            },
            ...companionUsers.map((companion) => ({
              orderId: order.id,
              userId: companion.id,
              isHost: false
            }))
          ]
        });

        return {
          response: {
            orderId: order.id,
            orderNo: order.orderNo,
            userId: user.id,
            resourceId: parentResource.id,
            resourceUnitIds: resourceUnits.map((unit) => unit.id),
            slotStarts: normalizedSlots.map((slot) => slot.start.toISOString()),
            slotEnds: normalizedSlots.map((slot) => slot.end.toISOString()),
            slotCount: sportsSlots.length,
            status: "confirmed" as const
          }
        };
      });

      await this.scheduleAttendanceEvaluation(
        created.response.orderId,
        normalizedSlots[0]!.start
      );
      return created.response;
    } catch (error) {
      if (isPrismaUniqueConstraintError(error, "sports_active_slot_unique")) {
        throw new ConflictException("sports-reservation-conflict");
      }

      throw error;
    }
  }

  async checkInReservation(
    orderId: string,
    currentUser: AuthenticatedUser
  ): Promise<ReservationCheckInResponse> {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        academicReservation: true,
        sportsReservationSlots: {
          orderBy: {
            slotStart: "asc"
          }
        },
        reservationParticipants: {
          include: {
            user: true
          }
        }
      }
    });

    if (!order || order.bizType !== OrderBizType.RESOURCE_RESERVATION) {
      throw new NotFoundException("reservation-order-not-found");
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException("reservation-not-open-for-check-in");
    }

    const participant = order.reservationParticipants.find(
      (item) => item.userId === currentUser.id
    );

    if (!participant) {
      throw new UnauthorizedException("reservation-check-in-not-allowed");
    }

    const reservationCategory = getReservationCategoryFromOrder(order);
    const reservationStartTime = getReservationStartTimeFromOrder(order);

    if (!reservationCategory || !reservationStartTime) {
      throw new BadRequestException("reservation-check-in-not-supported");
    }

    const { checkInOpenAt, checkInCloseAt } =
      buildReservationCheckInWindow(reservationStartTime);
    const now = new Date();

    if (now < checkInOpenAt || now > checkInCloseAt) {
      throw new BadRequestException("reservation-check-in-window-closed");
    }

    const checkedInAt =
      participant.checkedInAt ??
      (
        await this.prismaService.reservationParticipant.update({
          where: {
            orderId_userId: {
              orderId,
              userId: currentUser.id
            }
          },
          data: {
            checkedInAt: now
          }
        })
      ).checkedInAt;

    if (!checkedInAt) {
      throw new BadRequestException("reservation-check-in-failed");
    }

    return {
      orderId,
      participantUserId: participant.userId,
      participantUserEmail: participant.user.email,
      checkedInAt: checkedInAt.toISOString(),
      reservationCategory: mapReservationCategory(reservationCategory),
      checkInOpenAt: checkInOpenAt.toISOString(),
      checkInCloseAt: checkInCloseAt.toISOString(),
      orderStatus: "confirmed"
    };
  }

  private async getActiveReservationUser(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("invalid-session-user");
    }

    return user;
  }

  private async resolveCompanionUsers(companionEmails?: string[]) {
    const normalizedEmails = Array.from(
      new Set(
        (companionEmails ?? [])
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (!normalizedEmails.length) {
      return [];
    }

    const users = await this.prismaService.user.findMany({
      where: {
        email: {
          in: normalizedEmails
        },
        status: UserStatus.ACTIVE
      }
    });

    if (users.length !== normalizedEmails.length) {
      const foundEmails = new Set(users.map((user) => user.email.toLowerCase()));
      const missingEmails = normalizedEmails.filter((email) => !foundEmails.has(email));
      throw new BadRequestException(
        `companion-users-not-found:${missingEmails.join(",")}`
      );
    }

    return users;
  }

  private async assertReservationCategoryAvailable(
    users: Array<{ id: string }>,
    category: ReservationCategory
  ) {
    const now = new Date();
    const restrictions = await this.prismaService.userReservationRestriction.findMany({
      where: {
        userId: {
          in: users.map((user) => user.id)
        },
        category,
        bannedUntil: {
          gt: now
        }
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!restrictions.length) {
      return;
    }

    const firstRestriction = restrictions[0];

    if (!firstRestriction) {
      return;
    }

    throw new BadRequestException(
      `reservation-category-disabled:${firstRestriction.user.email}:${
        firstRestriction.bannedUntil?.toISOString() ??
        addDays(now, RESERVATION_BAN_DAYS).toISOString()
      }`
    );
  }

  private async scheduleAttendanceEvaluation(orderId: string, reservationStartTime: Date) {
    try {
      await this.reservationAttendanceQueueService.scheduleAttendanceEvaluation(
        orderId,
        addMinutes(reservationStartTime, CHECK_IN_WINDOW_MINUTES)
      );
    } catch (error) {
      this.logger.warn(
        `Failed to schedule attendance evaluation for order ${orderId}: ${
          error instanceof Error ? error.message : "unknown-error"
        }`
      );
    }
  }

  private assertResourceChannelOpen(
    resource: {
      id: string;
      name: string;
      releaseRules: Array<{
        frequency: "DAILY" | "WEEKLY" | "MONTHLY";
        dayOfWeek: number | null;
        dayOfMonth: number | null;
        hour: number;
        minute: number;
        isActive: boolean;
      }>;
      bookingClosures: Array<{
        startsAt: Date;
        endsAt: Date | null;
        reason: string | null;
        isActive: boolean;
      }>;
    },
    reservationStart: Date,
    reservationEnd: Date
  ) {
    const block = getResourceChannelBlock(
      resource.releaseRules,
      resource.bookingClosures,
      reservationStart,
      reservationEnd,
      new Date()
    );

    if (!block) {
      return;
    }

    if (block.type === "closure") {
      throw new BadRequestException(
        `resource-booking-closed:${resource.name}:${
          block.startsAt?.toISOString() ?? "now"
        }:${block.endsAt?.toISOString() ?? "open-ended"}`
      );
    }

    throw new BadRequestException(
      `resource-not-yet-released:${resource.name}:${
        block.availableAt?.toISOString() ?? reservationStart.toISOString()
      }`
    );
  }
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildReservationCheckInWindow(reservationStartTime: Date) {
  return {
    checkInOpenAt: addMinutes(reservationStartTime, -CHECK_IN_WINDOW_MINUTES),
    checkInCloseAt: addMinutes(reservationStartTime, CHECK_IN_WINDOW_MINUTES)
  };
}

function getReservationStartTimeFromOrder(order: {
  academicReservation: { startTime: Date } | null;
  sportsReservationSlots: Array<{ slotStart: Date }>;
}) {
  if (order.academicReservation) {
    return order.academicReservation.startTime;
  }

  return order.sportsReservationSlots[0]?.slotStart ?? null;
}

function getReservationCategoryFromOrder(order: {
  academicReservation: unknown;
  sportsReservationSlots: unknown[];
}) {
  if (order.academicReservation) {
    return ReservationCategory.ACADEMIC_SPACE;
  }

  if (order.sportsReservationSlots.length > 0) {
    return ReservationCategory.SPORTS_FACILITY;
  }

  return null;
}

function mapReservationCategory(
  category: ReservationCategory
): ReservationCheckInResponse["reservationCategory"] {
  return category === ReservationCategory.ACADEMIC_SPACE
    ? "academic_space"
    : "sports_facility";
}

function normalizeSportsSlots(slotStarts: string[]) {
  const normalized = Array.from(new Set(slotStarts))
    .map((value) => new Date(value))
    .sort((left, right) => left.getTime() - right.getTime());

  if (normalized.length === 0) {
    throw new BadRequestException("slot-starts-required");
  }

  for (const slot of normalized) {
    if (Number.isNaN(slot.getTime())) {
      throw new BadRequestException("invalid-slot-start");
    }

    if (
      slot.getUTCMinutes() !== 0 ||
      slot.getUTCSeconds() !== 0 ||
      slot.getUTCMilliseconds() !== 0
    ) {
      throw new BadRequestException("sports-slot-must-align-to-hour");
    }
  }

  return normalized.map((start) => ({
    start,
    end: addMinutes(start, SPORTS_SLOT_MINUTES)
  }));
}

function isPrismaUniqueConstraintError(error: unknown, target: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002" &&
    "meta" in error &&
    typeof error.meta === "object" &&
    error.meta !== null &&
    "target" in error.meta &&
    Array.isArray(error.meta.target) &&
    error.meta.target.includes(target)
  );
}
