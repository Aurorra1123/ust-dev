import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import {
  ActivityStatus,
  ActivityTicketStatus,
  OrderBizType,
  OrderStatus,
  Prisma,
  UserStatus
} from "@prisma/client";
import type {
  ActivityGrabRequest,
  ActivityGrabResponse,
  ActivityRegistrationStatusResponse
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ActivityInventoryCacheService } from "./activity-inventory-cache.service";
import {
  ACTIVITY_REGISTRATION_PENDING_TTL_MS,
  buildActivityRegistrationJobId,
  type ActivityRegistrationJobPayload
} from "./activity-registration.constants";
import { ActivityRegistrationQueueService } from "./activity-registration-queue.service";

@Injectable()
export class ActivityRegistrationService {
  private readonly logger = new Logger(ActivityRegistrationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityInventoryCacheService: ActivityInventoryCacheService,
    private readonly activityRegistrationQueueService: ActivityRegistrationQueueService
  ) {}

  async queueRegistration(
    activityId: string,
    payload: ActivityGrabRequest,
    currentUser: AuthenticatedUser
  ): Promise<ActivityGrabResponse> {
    const user = await this.getActiveUser(currentUser.id);
    const ticket = await this.getAvailableTicket(activityId, payload.ticketId);
    await this.assertNotRegistered(activityId, user.id);

    await this.activityInventoryCacheService.ensureTicketRemaining(
      ticket.id,
      Math.max(ticket.stock - ticket.reserved, 0)
    );

    const jobPayload = {
      activityId,
      ticketId: ticket.id,
      userId: user.id
    };
    const jobId = buildActivityRegistrationJobId(jobPayload);

    let reserveResult =
      await this.activityInventoryCacheService.reserveTicketForRequest({
        ...jobPayload,
        jobId,
        ttlMs: ACTIVITY_REGISTRATION_PENDING_TTL_MS
      });

    if (reserveResult === "missing_stock") {
      await this.activityInventoryCacheService.ensureTicketRemaining(
        ticket.id,
        Math.max(ticket.stock - ticket.reserved, 0)
      );

      reserveResult =
        await this.activityInventoryCacheService.reserveTicketForRequest({
          ...jobPayload,
          jobId,
          ttlMs: ACTIVITY_REGISTRATION_PENDING_TTL_MS
        });
    }

    switch (reserveResult) {
      case "sold_out":
        throw new ConflictException("activity-sold-out");
      case "duplicate_pending":
        throw new ConflictException("activity-grab-already-pending");
      case "missing_stock":
        throw new ServiceUnavailableException("activity-stock-cache-missing");
      case "reserved":
        break;
    }

    try {
      await this.activityRegistrationQueueService.enqueueRegistration(jobPayload);
    } catch {
      await this.activityInventoryCacheService.compensatePendingReservation(
        activityId,
        ticket.id,
        user.id,
        "queue-enqueue-failed"
      );
      throw new ServiceUnavailableException("activity-grab-queue-unavailable");
    }

    return {
      activityId,
      ticketId: ticket.id,
      jobId,
      requestStatus: "queued"
    };
  }

  async getRegistrationStatus(
    activityId: string,
    currentUser: AuthenticatedUser
  ): Promise<ActivityRegistrationStatusResponse> {
    const user = await this.getActiveUser(currentUser.id);
    const registration = await this.prismaService.activityRegistration.findFirst({
      where: {
        activityId,
        userId: user.id
      },
      include: {
        order: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (registration) {
      return {
        activityId: registration.activityId,
        ticketId: registration.activityTicketId,
        userId: registration.userId,
        orderId: registration.orderId,
        orderNo: registration.order.orderNo,
        jobId: null,
        status: mapPrismaOrderStatus(registration.status),
        reason: null
      };
    }

    const pendingJobId =
      await this.activityInventoryCacheService.getPendingJobId(activityId, user.id);

    if (pendingJobId) {
      return {
        activityId,
        ticketId: null,
        userId: user.id,
        orderId: null,
        orderNo: null,
        jobId: pendingJobId,
        status: "queued",
        reason: null
      };
    }

    const failureReason =
      await this.activityInventoryCacheService.getFailureReason(activityId, user.id);

    if (failureReason) {
      return {
        activityId,
        ticketId: null,
        userId: user.id,
        orderId: null,
        orderNo: null,
        jobId: null,
        status: "failed",
        reason: failureReason
      };
    }

    throw new NotFoundException("activity-registration-not-found");
  }

  async processQueuedRegistration(payload: ActivityRegistrationJobPayload) {
    const existing = await this.prismaService.activityRegistration.findFirst({
      where: {
        activityId: payload.activityId,
        userId: payload.userId,
        status: {
          in: [
            OrderStatus.PENDING_CONFIRMATION,
            OrderStatus.CONFIRMED,
            OrderStatus.NO_SHOW
          ]
        }
      },
      include: {
        order: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (existing) {
      await this.activityInventoryCacheService.markRequestCompleted(
        payload.activityId,
        payload.userId
      );

      return {
        activityId: existing.activityId,
        ticketId: existing.activityTicketId,
        userId: existing.userId,
        orderId: existing.orderId,
        orderNo: existing.order.orderNo,
        jobId: null,
        status: mapPrismaOrderStatus(existing.status),
        reason: null
      } satisfies ActivityRegistrationStatusResponse;
    }

    try {
      const created = await this.prismaService.$transaction(async (tx) => {
        const ticket = await tx.activityTicket.findFirst({
          where: {
            id: payload.ticketId,
            activityId: payload.activityId,
            status: ActivityTicketStatus.ACTIVE,
            activity: {
              id: payload.activityId,
              status: ActivityStatus.PUBLISHED,
              saleStartTime: {
                lte: new Date()
              },
              saleEndTime: {
                gte: new Date()
              }
            }
          }
        });

        if (!ticket) {
          throw new NotFoundException("activity-ticket-not-available");
        }

        const updatedRows = await tx.$executeRaw`
          UPDATE "ActivityTicket"
          SET "reserved" = "reserved" + 1,
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${payload.ticketId}
            AND "activityId" = ${payload.activityId}
            AND "status" = 'ACTIVE'
            AND "reserved" < "stock"
        `;

        if (Number(updatedRows) !== 1) {
          throw new ConflictException("activity-sold-out");
        }

        const order = await tx.order.create({
          data: {
            userId: payload.userId,
            activityId: payload.activityId,
            bizType: OrderBizType.ACTIVITY_REGISTRATION,
            status: OrderStatus.CONFIRMED,
            totalAmountCents: ticket.priceCents,
            items: {
              create: {
                activityTicketId: payload.ticketId,
                quantity: 1,
                slotCount: 1,
                unitPriceCents: ticket.priceCents
              }
            },
            statusLogs: {
              create: {
                toStatus: OrderStatus.CONFIRMED,
                reason: "activity-registration-confirmed"
              }
            }
          }
        });

        const registration = await tx.activityRegistration.create({
          data: {
            orderId: order.id,
            activityId: payload.activityId,
            activityTicketId: payload.ticketId,
            userId: payload.userId,
            status: OrderStatus.CONFIRMED
          }
        });

        return {
          registration,
          order
        };
      });

      await this.activityInventoryCacheService.markRequestCompleted(
        payload.activityId,
        payload.userId
      );

      return {
        activityId: created.registration.activityId,
        ticketId: created.registration.activityTicketId,
        userId: created.registration.userId,
        orderId: created.registration.orderId,
        orderNo: created.order.orderNo,
        jobId: null,
        status: "confirmed",
        reason: null
      } satisfies ActivityRegistrationStatusResponse;
    } catch (error) {
      if (isDuplicateActiveRegistrationError(error)) {
        const duplicated = await this.prismaService.activityRegistration.findFirst({
          where: {
            activityId: payload.activityId,
            userId: payload.userId,
            status: {
              in: [
                OrderStatus.PENDING_CONFIRMATION,
                OrderStatus.CONFIRMED,
                OrderStatus.NO_SHOW
              ]
            }
          },
          include: {
            order: true
          },
          orderBy: {
            createdAt: "desc"
          }
        });

        await this.activityInventoryCacheService.markRequestCompleted(
          payload.activityId,
          payload.userId
        );

        if (duplicated) {
          return {
            activityId: duplicated.activityId,
            ticketId: duplicated.activityTicketId,
            userId: duplicated.userId,
            orderId: duplicated.orderId,
            orderNo: duplicated.order.orderNo,
            jobId: null,
            status: mapPrismaOrderStatus(duplicated.status),
            reason: null
          } satisfies ActivityRegistrationStatusResponse;
        }
      }

      const failureReason = normalizeRegistrationFailure(error);
      this.logger.warn(
        `Activity registration failed for ${payload.activityId}/${payload.userId}: ${failureReason}`
      );

      await this.activityInventoryCacheService.compensatePendingReservation(
        payload.activityId,
        payload.ticketId,
        payload.userId,
        failureReason
      );

      return {
        activityId: payload.activityId,
        ticketId: payload.ticketId,
        userId: payload.userId,
        orderId: null,
        orderNo: null,
        jobId: null,
        status: "failed",
        reason: failureReason
      } satisfies ActivityRegistrationStatusResponse;
    }
  }

  private async getActiveUser(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("invalid-session-user");
    }

    return user;
  }

  private async getAvailableTicket(activityId: string, ticketId: string) {
    const now = new Date();
    const ticket = await this.prismaService.activityTicket.findFirst({
      where: {
        id: ticketId,
        activityId,
        status: ActivityTicketStatus.ACTIVE,
        activity: {
          id: activityId,
          status: ActivityStatus.PUBLISHED,
          saleStartTime: {
            lte: now
          },
          saleEndTime: {
            gte: now
          }
        }
      }
    });

    if (!ticket) {
      throw new NotFoundException("activity-ticket-not-available");
    }

    return ticket;
  }

  private async assertNotRegistered(activityId: string, userId: string) {
    const existing = await this.prismaService.activityRegistration.findFirst({
      where: {
        activityId,
        userId,
        status: {
          in: [
            OrderStatus.PENDING_CONFIRMATION,
            OrderStatus.CONFIRMED,
            OrderStatus.NO_SHOW
          ]
        }
      },
      select: {
        id: true
      }
    });

    if (existing) {
      throw new ConflictException("activity-already-registered");
    }
  }
}

function isDuplicateActiveRegistrationError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function normalizeRegistrationFailure(error: unknown) {
  if (error instanceof NotFoundException) {
    return "activity-ticket-not-available";
  }

  if (error instanceof ConflictException) {
    const response = error.getResponse();

    if (typeof response === "string") {
      return response;
    }

    if (
      typeof response === "object" &&
      response !== null &&
      "message" in response
    ) {
      const message = (response as { message?: unknown }).message;

      if (typeof message === "string") {
        return message;
      }
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2002"
      ? "activity-already-registered"
      : `db-${error.code.toLowerCase()}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "activity-registration-failed";
}

function mapPrismaOrderStatus(
  value: OrderStatus
): ActivityRegistrationStatusResponse["status"] {
  switch (value) {
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
