import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef
} from "@nestjs/common";
import {
  OrderBizType as PrismaOrderBizType,
  OrderStatus,
  PaymentStatus as PrismaPaymentStatus,
  Prisma
} from "@prisma/client";
import type { AuthUser, OrderDetailResponse } from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ActivityInventoryCacheService } from "../activities/activity-inventory-cache.service";
import { RulesService } from "../rules/rules.service";
import {
  buildReservationCheckInWindow,
  getReservationAttendanceEvaluateAt,
  getReservationCategoryFromOrder,
  getReservationStartTimeFromOrder,
  mapReservationCategory
} from "../reservation/shared/reservation-policy";
import { OrderExpirationQueueService } from "./order-expiration-queue.service";
import { ReservationAttendanceQueueService } from "./reservation-attendance-queue.service";

const orderDetailInclude = {
  user: true,
  academicReservation: {
    include: {
      resource: true,
      resourceUnit: true
    }
  },
  activityRegistration: {
    include: {
      activity: true,
      activityTicket: true
    }
  },
  sportsReservationSlots: {
    include: {
      resource: true,
      resourceUnit: true
    },
    orderBy: {
      slotStart: "asc"
    }
  },
  items: {
    include: {
      resource: true,
      resourceUnit: true,
      activityTicket: true
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  statusLogs: {
    orderBy: {
      createdAt: "asc"
    }
  },
  paymentRecords: {
    orderBy: {
      createdAt: "asc"
    }
  },
  reservationParticipants: {
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      }
    },
    orderBy: [{ isHost: "desc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderDetailInclude;
}>;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly orderExpirationQueueService: OrderExpirationQueueService,
    @Inject(forwardRef(() => ActivityInventoryCacheService))
    private readonly activityInventoryCacheService: ActivityInventoryCacheService,
    private readonly reservationAttendanceQueueService: ReservationAttendanceQueueService,
    private readonly rulesService: RulesService
  ) {}

  async listOrders(actor: AuthUser): Promise<OrderDetailResponse[]> {
    const orders = await this.prismaService.order.findMany({
      where:
        actor.role === "admin"
          ? undefined
          : {
              OR: [
                {
                  userId: actor.id
                },
                {
                  reservationParticipants: {
                    some: {
                      userId: actor.id
                    }
                  }
                }
              ]
            },
      include: orderDetailInclude,
      orderBy: {
        createdAt: "desc"
      },
      take: 30
    });

    return orders.map(toOrderDetail);
  }

  async getOrder(orderId: string, actor: AuthUser): Promise<OrderDetailResponse> {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: orderDetailInclude
    });

    if (!order) {
      throw new NotFoundException("order-not-found");
    }

    this.assertOrderReadable(order, actor);
    return toOrderDetail(order);
  }

  confirmOrder(orderId: string, reason?: string) {
    return this.transitionOrder(orderId, {
      nextStatus: OrderStatus.CONFIRMED,
      allowedFrom: [OrderStatus.PENDING_CONFIRMATION],
      reason: reason ?? "manual-confirmation"
    });
  }

  confirmOrderAfterPayment(
    orderId: string,
    paymentRecordId: string,
    reason?: string
  ) {
    return this.transitionOrder(orderId, {
      nextStatus: OrderStatus.CONFIRMED,
      allowedFrom: [OrderStatus.PENDING_CONFIRMATION],
      reason: reason ?? "payment-confirmed",
      transactionWork: async (tx, order) => {
        const paymentUpdate = await tx.paymentRecord.updateMany({
          where: {
            id: paymentRecordId,
            orderId: order.id,
            payStatus: PrismaPaymentStatus.PENDING
          },
          data: {
            payStatus: PrismaPaymentStatus.PAID,
            paidAt: new Date()
          }
        });

        if (paymentUpdate.count !== 1) {
          throw new ConflictException("payment-confirmation-conflict");
        }
      }
    });
  }

  cancelOrder(orderId: string, actor: AuthUser, reason?: string) {
    return this.transitionOrder(orderId, {
      actor,
      requireOwnerOrAdmin: true,
      nextStatus: OrderStatus.CANCELLED,
      allowedFrom: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED],
      reason: reason ?? "user-cancelled"
    });
  }

  markNoShow(orderId: string, reason?: string) {
    return this.transitionOrder(orderId, {
      nextStatus: OrderStatus.NO_SHOW,
      allowedFrom: [OrderStatus.CONFIRMED],
      reason: reason ?? "no-show"
    });
  }

  async expirePendingOrders() {
    const now = new Date();
    const pendingOrders = await this.prismaService.order.findMany({
      where: {
        status: OrderStatus.PENDING_CONFIRMATION,
        expireAt: {
          lte: now
        }
      },
      select: {
        id: true
      },
      orderBy: {
        expireAt: "asc"
      },
      take: 50
    });

    const results: Array<{
      orderId: string;
      status: string;
      detail?: string;
    }> = [];

    for (const order of pendingOrders) {
      try {
        const updated = await this.expirePendingOrderById(order.id);

        results.push({
          orderId: order.id,
          status: updated?.status ?? "skipped"
        });
      } catch (error) {
        results.push({
          orderId: order.id,
          status: "skipped",
          detail: error instanceof Error ? error.message : "unknown-error"
        });
      }
    }

    return {
      processed: results.length,
      results
    };
  }

  async expirePendingOrderById(
    orderId: string,
    reason = "timeout-cancelled"
  ) {
    try {
      return await this.transitionOrder(orderId, {
        nextStatus: OrderStatus.CANCELLED,
        allowedFrom: [OrderStatus.PENDING_CONFIRMATION],
        reason
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        return null;
      }

      throw error;
    }
  }

  private async transitionOrder(
    orderId: string,
    params: {
      actor?: AuthUser;
      requireOwnerOrAdmin?: boolean;
      nextStatus: OrderStatus;
      allowedFrom: OrderStatus[];
      reason: string;
      transactionWork?: (
        tx: Prisma.TransactionClient,
        order: NonNullable<
          Awaited<ReturnType<PrismaService["order"]["findUnique"]>>
        >
      ) => Promise<void>;
    }
  ) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        academicReservation: true,
        activityRegistration: true,
        sportsReservationSlots: true
      }
    });

    if (!order) {
      throw new NotFoundException("order-not-found");
    }

    if (params.requireOwnerOrAdmin) {
      if (!params.actor) {
        throw new ForbiddenException("missing-order-actor");
      }

      this.assertOrderOwnerOrAdmin(order.userId, params.actor);
    }

    if (!params.allowedFrom.includes(order.status)) {
      throw new BadRequestException(
        `invalid-order-transition:${order.status}->${params.nextStatus}`
      );
    }

    const latest = await this.prismaService.$transaction(async (tx) => {
      const updatedCount = await tx.order.updateMany({
        where: {
          id: order.id,
          version: order.version,
          status: order.status
        },
        data: {
          status: params.nextStatus,
          expireAt:
            params.nextStatus === OrderStatus.PENDING_CONFIRMATION ? order.expireAt : null,
          version: {
            increment: 1
          }
        }
      });

      if (updatedCount.count !== 1) {
        throw new ConflictException("order-transition-conflict");
      }

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: params.nextStatus,
          reason: params.reason
        }
      });

      if (order.academicReservation) {
        await tx.academicReservation.update({
          where: {
            orderId: order.id
          },
          data: {
            status: params.nextStatus
          }
        });
      }

      if (order.sportsReservationSlots.length > 0) {
        await tx.sportsReservationSlot.updateMany({
          where: {
            orderId: order.id
          },
          data: {
            status: params.nextStatus
          }
        });
      }

      if (order.activityRegistration) {
        if (params.nextStatus === OrderStatus.CANCELLED) {
          const updatedRows = await tx.$executeRaw`
            UPDATE "ActivityTicket"
            SET "reserved" = "reserved" - 1,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "id" = ${order.activityRegistration.activityTicketId}
              AND "reserved" > 0
          `;

          if (Number(updatedRows) !== 1) {
            throw new ConflictException("activity-ticket-release-conflict");
          }
        }

        await tx.activityRegistration.update({
          where: {
            orderId: order.id
          },
          data: {
            status: params.nextStatus
          }
        });
      }

      if (
        params.nextStatus === OrderStatus.CANCELLED &&
        order.status === OrderStatus.PENDING_CONFIRMATION &&
        order.totalAmountCents > 0
      ) {
        await tx.paymentRecord.updateMany({
          where: {
            orderId: order.id,
            payStatus: PrismaPaymentStatus.PENDING
          },
          data: {
            payStatus: PrismaPaymentStatus.FAILED
          }
        });
      }

      if (params.transactionWork) {
        await params.transactionWork(tx, order);
      }

      const latestOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: orderDetailInclude
      });

      if (!latestOrder) {
        throw new NotFoundException("order-not-found-after-transition");
      }

      return latestOrder;
    });

    if (params.nextStatus !== OrderStatus.PENDING_CONFIRMATION) {
      try {
        await this.orderExpirationQueueService.removeExpiration(order.id);
      } catch (error) {
        this.logger.warn(
          `Failed to remove expiration job for order ${order.id}: ${
            error instanceof Error ? error.message : "unknown-error"
          }`
        );
      }
    }

    const reservationStartTime = getReservationStartTimeFromOrder(latest);

    if (reservationStartTime) {
      try {
        if (params.nextStatus === OrderStatus.CONFIRMED) {
          await this.reservationAttendanceQueueService.scheduleAttendanceEvaluation(
            order.id,
            getReservationAttendanceEvaluateAt(reservationStartTime)
          );
        } else {
          await this.reservationAttendanceQueueService.removeAttendanceEvaluation(
            order.id
          );
        }
      } catch (error) {
        this.logger.warn(
          `Failed to synchronize reservation attendance job for order ${order.id}: ${
            error instanceof Error ? error.message : "unknown-error"
          }`
        );
      }
    }

    if (
      params.nextStatus === OrderStatus.CANCELLED &&
      order.activityRegistration
    ) {
      try {
        await this.activityInventoryCacheService.releaseConfirmedReservation(
          order.activityRegistration.activityId,
          order.activityRegistration.activityTicketId,
          order.userId
        );
      } catch (error) {
        this.logger.warn(
          `Failed to refresh activity cache for order ${order.id}: ${
            error instanceof Error ? error.message : "unknown-error"
          }`
        );
      }
    }

    return toOrderDetail(latest);
  }

  async finalizeReservationAttendance(orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: orderDetailInclude
    });

    if (!order || order.bizType !== PrismaOrderBizType.RESOURCE_RESERVATION) {
      return null;
    }

    const reservationCategory = getReservationCategoryFromOrder(order);
    const reservationStartTime = getReservationStartTimeFromOrder(order);
    const reservationResourceId =
      order.academicReservation?.resourceId ??
      order.sportsReservationSlots[0]?.resourceId ??
      order.items[0]?.resourceId ??
      null;

    if (!reservationCategory || !reservationStartTime || !reservationResourceId) {
      return null;
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      return {
        orderId,
        status: "skipped"
      };
    }

    const { checkInCloseAt } = buildReservationCheckInWindow(reservationStartTime);
    const hasCheckedIn = order.reservationParticipants.some(
      (participant) =>
        participant.checkedInAt !== null &&
        participant.checkedInAt.getTime() <= checkInCloseAt.getTime()
    );

    if (hasCheckedIn) {
      return {
        orderId,
        status: "checked_in"
      };
    }

    const latest = await this.prismaService.$transaction(async (tx) => {
      const updatedCount = await tx.order.updateMany({
        where: {
          id: order.id,
          version: order.version,
          status: OrderStatus.CONFIRMED
        },
        data: {
          status: OrderStatus.NO_SHOW,
          version: {
            increment: 1
          }
        }
      });

      if (updatedCount.count !== 1) {
        return null;
      }

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.CONFIRMED,
          toStatus: OrderStatus.NO_SHOW,
          reason: "reservation-check-in-missed"
        }
      });

      if (order.academicReservation) {
        await tx.academicReservation.update({
          where: {
            orderId: order.id
          },
          data: {
            status: OrderStatus.NO_SHOW
          }
        });
      }

      if (order.sportsReservationSlots.length > 0) {
        await tx.sportsReservationSlot.updateMany({
          where: {
            orderId: order.id
          },
          data: {
            status: OrderStatus.NO_SHOW
          }
        });
      }

      await this.rulesService.applyReservationNoShowRules({
        tx,
        resourceId: reservationResourceId,
        orderId: order.id,
        participantUserIds: order.reservationParticipants.map(
          (participant) => participant.userId
        ),
        reservationCategory,
        occurredAt: new Date()
      });

      const latestOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: orderDetailInclude
      });

      if (!latestOrder) {
        throw new NotFoundException("order-not-found-after-attendance");
      }

      return latestOrder;
    });

    try {
      await this.reservationAttendanceQueueService.removeAttendanceEvaluation(order.id);
    } catch (error) {
      this.logger.warn(
        `Failed to remove reservation attendance job for order ${order.id}: ${
          error instanceof Error ? error.message : "unknown-error"
        }`
      );
    }

    return latest ? toOrderDetail(latest) : null;
  }

  private assertOrderReadable(order: Pick<OrderWithRelations, "userId" | "reservationParticipants">, actor: AuthUser) {
    if (
      actor.role === "admin" ||
      actor.id === order.userId ||
      order.reservationParticipants.some((participant) => participant.userId === actor.id)
    ) {
      return;
    }

    throw new ForbiddenException("forbidden-order-access");
  }

  private assertOrderOwnerOrAdmin(orderUserId: string, actor: AuthUser) {
    if (actor.role === "admin" || actor.id === orderUserId) {
      return;
    }

    throw new ForbiddenException("forbidden-order-access");
  }
}

function toOrderDetail(order: OrderWithRelations): OrderDetailResponse {
  const reservationCategory = getReservationCategoryFromOrder(order);
  const reservationStartTime = getReservationStartTimeFromOrder(order);
  const checkInWindow = reservationStartTime
    ? buildReservationCheckInWindow(reservationStartTime)
    : null;

  return {
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    userEmail: order.user.email,
    activityId: order.activityId,
    bizType: mapPrismaBizType(order.bizType),
    status: mapPrismaOrderStatus(order.status),
    version: order.version,
    expireAt: order.expireAt?.toISOString() ?? null,
    totalAmountCents: order.totalAmountCents,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    reservationCategory: reservationCategory
      ? mapReservationCategory(reservationCategory)
      : null,
    reservationStartTime: reservationStartTime?.toISOString() ?? null,
    checkInOpenAt: checkInWindow?.checkInOpenAt.toISOString() ?? null,
    checkInCloseAt: checkInWindow?.checkInCloseAt.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      slotCount: item.slotCount,
      startTime: item.startTime?.toISOString() ?? null,
      endTime: item.endTime?.toISOString() ?? null,
      bufferBeforeMin: item.bufferBeforeMin,
      bufferAfterMin: item.bufferAfterMin,
      unitPriceCents: item.unitPriceCents,
      resourceName: item.resource?.name ?? null,
      resourceUnitName: item.resourceUnit?.name ?? null,
      activityTicketName: item.activityTicket?.name ?? null
    })),
    statusLogs: order.statusLogs.map((log) => ({
      id: log.id,
      fromStatus: log.fromStatus ? mapPrismaOrderStatus(log.fromStatus) : null,
      toStatus: mapPrismaOrderStatus(log.toStatus),
      reason: log.reason,
      createdAt: log.createdAt.toISOString()
    })),
    paymentRecords: order.paymentRecords.map((record) => ({
      id: record.id,
      orderId: record.orderId,
      payStatus: mapPrismaPaymentStatus(record.payStatus),
      transactionNo: record.transactionNo,
      amountCents: record.amountCents,
      paidAt: record.paidAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    })),
    reservationParticipants: order.reservationParticipants.map((participant) => ({
      userId: participant.userId,
      userEmail: participant.user.email,
      isHost: participant.isHost,
      checkedInAt: participant.checkedInAt?.toISOString() ?? null
    })),
    academicReservation: order.academicReservation
      ? {
          id: order.academicReservation.id,
          resourceId: order.academicReservation.resourceId,
          resourceName: order.academicReservation.resource.name,
          resourceUnitId: order.academicReservation.resourceUnitId,
          resourceUnitName: order.academicReservation.resourceUnit.name,
          startTime: order.academicReservation.startTime.toISOString(),
          endTime: order.academicReservation.endTime.toISOString(),
          bufferBeforeMin: order.academicReservation.bufferBeforeMin,
          bufferAfterMin: order.academicReservation.bufferAfterMin,
          status: mapPrismaOrderStatus(order.academicReservation.status)
        }
      : null,
    sportsReservationSlots: order.sportsReservationSlots.map((slot) => ({
      id: slot.id,
      resourceId: slot.resourceId,
      resourceName: slot.resource.name,
      resourceUnitId: slot.resourceUnitId,
      resourceUnitName: slot.resourceUnit.name,
      slotStart: slot.slotStart.toISOString(),
      slotEnd: slot.slotEnd.toISOString(),
      status: mapPrismaOrderStatus(slot.status)
    })),
    activityRegistration: order.activityRegistration
      ? {
          id: order.activityRegistration.id,
          activityId: order.activityRegistration.activityId,
          activityTitle: order.activityRegistration.activity.title,
          activityTicketId: order.activityRegistration.activityTicketId,
          activityTicketName: order.activityRegistration.activityTicket.name,
          status: mapPrismaOrderStatus(order.activityRegistration.status)
        }
      : null
  };
}

function mapPrismaOrderStatus(
  status: OrderStatus
): OrderDetailResponse["status"] {
  switch (status) {
    case OrderStatus.PENDING_CONFIRMATION:
      return "pending_confirmation";
    case OrderStatus.CONFIRMED:
      return "confirmed";
    case OrderStatus.CANCELLED:
      return "cancelled";
    case OrderStatus.NO_SHOW:
      return "no_show";
  }
}

function mapPrismaBizType(
  bizType: PrismaOrderBizType
): OrderDetailResponse["bizType"] {
  return bizType === PrismaOrderBizType.ACTIVITY_REGISTRATION
    ? "activity_registration"
    : "resource_reservation";
}

function mapPrismaPaymentStatus(
  status: PrismaPaymentStatus
): OrderDetailResponse["paymentRecords"][number]["payStatus"] {
  switch (status) {
    case PrismaPaymentStatus.PENDING:
      return "pending";
    case PrismaPaymentStatus.PAID:
      return "paid";
    case PrismaPaymentStatus.FAILED:
      return "failed";
    case PrismaPaymentStatus.REFUNDED:
      return "refunded";
  }
}
