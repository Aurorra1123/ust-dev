import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import type { AuthUser } from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ActivityInventoryCacheService } from "../activities/activity-inventory-cache.service";
import { OrderExpirationQueueService } from "./order-expiration-queue.service";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly orderExpirationQueueService: OrderExpirationQueueService,
    private readonly activityInventoryCacheService: ActivityInventoryCacheService
  ) {}

  async getOrder(orderId: string, actor: AuthUser) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        academicReservation: true,
        activityRegistration: true,
        sportsReservationSlots: true,
        items: true,
        statusLogs: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException("order-not-found");
    }

    this.assertOrderReadable(order.userId, actor);
    return order;
  }

  confirmOrder(orderId: string, reason?: string) {
    return this.transitionOrder(orderId, {
      nextStatus: OrderStatus.CONFIRMED,
      allowedFrom: [OrderStatus.PENDING_CONFIRMATION],
      reason: reason ?? "manual-confirmation"
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
        error instanceof NotFoundException
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

      this.assertOrderReadable(order.userId, params.actor);
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

      const latestOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          academicReservation: true,
          activityRegistration: true,
          sportsReservationSlots: true,
          statusLogs: {
            orderBy: {
              createdAt: "asc"
            }
          }
        }
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

    return latest;
  }

  private assertOrderReadable(orderUserId: string, actor: AuthUser) {
    if (actor.role === "admin" || actor.id === orderUserId) {
      return;
    }

    throw new ForbiddenException("forbidden-order-access");
  }
}
