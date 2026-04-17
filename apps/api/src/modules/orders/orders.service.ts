import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { OrderStatus } from "@prisma/client";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOrder(orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        academicReservation: true,
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

    return order;
  }

  confirmOrder(orderId: string, reason?: string) {
    return this.transitionOrder(orderId, {
      nextStatus: OrderStatus.CONFIRMED,
      allowedFrom: [OrderStatus.PENDING_CONFIRMATION],
      reason: reason ?? "manual-confirmation"
    });
  }

  cancelOrder(orderId: string, reason?: string) {
    return this.transitionOrder(orderId, {
      nextStatus: OrderStatus.CANCELLED,
      allowedFrom: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED],
      reason: reason ?? "cancelled"
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

    const results = await Promise.all(
      pendingOrders.map(async (order) => {
        try {
          const updated = await this.transitionOrder(order.id, {
            nextStatus: OrderStatus.CANCELLED,
            allowedFrom: [OrderStatus.PENDING_CONFIRMATION],
            reason: "timeout-cancelled"
          });

          return {
            orderId: updated.id,
            status: updated.status
          };
        } catch (error) {
          return {
            orderId: order.id,
            status: "skipped",
            detail: error instanceof Error ? error.message : "unknown-error"
          };
        }
      })
    );

    return {
      processed: results.length,
      results
    };
  }

  private async transitionOrder(
    orderId: string,
    params: {
      nextStatus: OrderStatus;
      allowedFrom: OrderStatus[];
      reason: string;
    }
  ) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        academicReservation: true,
        sportsReservationSlots: true
      }
    });

    if (!order) {
      throw new NotFoundException("order-not-found");
    }

    if (!params.allowedFrom.includes(order.status)) {
      throw new BadRequestException(
        `invalid-order-transition:${order.status}->${params.nextStatus}`
      );
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
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

        const latest = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            academicReservation: true,
            sportsReservationSlots: true,
            statusLogs: {
              orderBy: {
                createdAt: "asc"
              }
            }
          }
        });

        if (!latest) {
          throw new NotFoundException("order-not-found-after-transition");
        }

        return latest;
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      throw error;
    }
  }
}
