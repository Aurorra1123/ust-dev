import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  OrderBizType,
  OrderStatus,
  ResourceType,
  UserRole,
  UserStatus
} from "@prisma/client";
import type {
  AcademicReservationRequest,
  AcademicReservationResponse
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";

const ACADEMIC_BUFFER_MINUTES = 5;
const ORDER_EXPIRE_MINUTES = 15;

@Injectable()
export class ReservationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async createAcademicReservation(
    payload: AcademicReservationRequest
  ): Promise<AcademicReservationResponse> {
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

    const requestedEmail =
      payload.userEmail?.trim().toLowerCase() ??
      this.configService.getOrThrow<string>("DEMO_USER_EMAIL");

    const existingConflict = await this.prismaService.academicReservation.findFirst({
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
      return await this.prismaService.$transaction(async (tx) => {
        const user = await tx.user.upsert({
          where: { email: requestedEmail },
          update: {},
          create: {
            email: requestedEmail,
            name: inferNameFromEmail(requestedEmail),
            role: requestedEmail === this.configService.getOrThrow<string>("DEMO_USER_EMAIL")
              ? mapUserRole(
                  this.configService.getOrThrow<string>("DEMO_USER_ROLE")
                )
              : UserRole.STUDENT,
            status: UserStatus.ACTIVE
          }
        });

        const order = await tx.order.create({
          data: {
            userId: user.id,
            bizType: OrderBizType.RESOURCE_RESERVATION,
            status: OrderStatus.PENDING_CONFIRMATION,
            expireAt: addMinutes(new Date(), ORDER_EXPIRE_MINUTES),
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
          status: "pending_confirmation"
        };
      });
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
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function inferNameFromEmail(email: string) {
  return email.split("@")[0] || "student";
}

function mapUserRole(role: string) {
  return role === "admin" ? UserRole.ADMIN : UserRole.STUDENT;
}
