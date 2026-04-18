import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  OrderBizType,
  OrderStatus,
  ResourceAvailabilityMode,
  ResourceType,
  UserStatus
} from "@prisma/client";
import type {
  AcademicReservationRequest,
  AcademicReservationResponse,
  SportsReservationRequest,
  SportsReservationResponse
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { OrderExpirationQueueService } from "../orders/order-expiration-queue.service";

const ACADEMIC_BUFFER_MINUTES = 5;
const DEFAULT_ORDER_EXPIRE_SECONDS = 15 * 60;
const SPORTS_SLOT_MINUTES = 60;

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly orderExpirationQueueService: OrderExpirationQueueService
  ) {}

  async createAcademicReservation(
    payload: AcademicReservationRequest,
    currentUser: AuthenticatedUser
  ): Promise<AcademicReservationResponse> {
    const user = await this.getActiveReservationUser(currentUser.id);
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
        resource: true
      }
    });

    if (!resourceUnit) {
      throw new NotFoundException("resource-unit-not-found");
    }

    if (resourceUnit.resource.type !== ResourceType.ACADEMIC_SPACE) {
      throw new BadRequestException("resource-unit-is-not-academic-space");
    }

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
        const expireAt = buildOrderExpireAt(this.configService);
        const order = await tx.order.create({
          data: {
            userId: user.id,
            bizType: OrderBizType.RESOURCE_RESERVATION,
            status: OrderStatus.PENDING_CONFIRMATION,
            expireAt,
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
                toStatus: OrderStatus.PENDING_CONFIRMATION,
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
            status: OrderStatus.PENDING_CONFIRMATION
          }
        });

        return {
          expireAt,
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
            status: "pending_confirmation" as const
          }
        };
      });

      await this.scheduleOrderExpiration(created.response.orderId, created.expireAt);
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
            resource: true
          }
        })
      : null;

    const reservationGroup = hasGroup
      ? await this.prismaService.resourceGroup.findUnique({
          where: { id: payload.resourceGroupId },
          include: {
            resource: true,
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

    for (const unit of resourceUnits) {
      if (unit.resource.type !== ResourceType.SPORTS_FACILITY) {
        throw new BadRequestException("resource-unit-is-not-sports-facility");
      }

      if (unit.availabilityMode !== ResourceAvailabilityMode.DISCRETE_SLOT) {
        throw new BadRequestException("resource-unit-is-not-slot-based");
      }
    }

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
        const expireAt = buildOrderExpireAt(this.configService);
        const order = await tx.order.create({
          data: {
            userId: user.id,
            bizType: OrderBizType.RESOURCE_RESERVATION,
            status: OrderStatus.PENDING_CONFIRMATION,
            expireAt,
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
            status: OrderStatus.PENDING_CONFIRMATION
          }))
        );

        await tx.orderItem.createMany({
          data: orderItems
        });

        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            toStatus: OrderStatus.PENDING_CONFIRMATION,
            reason: hasGroup
              ? "sports-group-reservation-created"
              : "sports-reservation-created"
          }
        });

        await tx.sportsReservationSlot.createMany({
          data: sportsSlots
        });

        return {
          expireAt,
          response: {
            orderId: order.id,
            orderNo: order.orderNo,
            userId: user.id,
            resourceId: parentResource.id,
            resourceUnitIds: resourceUnits.map((unit) => unit.id),
            slotStarts: normalizedSlots.map((slot) => slot.start.toISOString()),
            slotEnds: normalizedSlots.map((slot) => slot.end.toISOString()),
            slotCount: sportsSlots.length,
            status: "pending_confirmation" as const
          }
        };
      });

      await this.scheduleOrderExpiration(created.response.orderId, created.expireAt);
      return created.response;
    } catch (error) {
      if (isPrismaUniqueConstraintError(error, "sports_active_slot_unique")) {
        throw new ConflictException("sports-reservation-conflict");
      }

      throw error;
    }
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

  private async scheduleOrderExpiration(orderId: string, expireAt: Date) {
    try {
      await this.orderExpirationQueueService.scheduleExpiration(orderId, expireAt);
    } catch (error) {
      this.logger.warn(
        `Failed to schedule expiration for order ${orderId}: ${
          error instanceof Error ? error.message : "unknown-error"
        }`
      );
    }
  }
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function buildOrderExpireAt(configService: ConfigService) {
  const seconds =
    configService.get<number>("ORDER_PENDING_EXPIRE_SECONDS") ??
    DEFAULT_ORDER_EXPIRE_SECONDS;

  return new Date(Date.now() + seconds * 1000);
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
