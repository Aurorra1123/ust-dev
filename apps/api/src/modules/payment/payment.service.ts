import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  PaymentCompensationType,
  PaymentStatus
} from "@prisma/client";
import type {
  MockPaymentStartResponse,
  OrderDetailResponse,
  PaymentRecordDetail
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ordersService: OrdersService
  ) {}

  async getLatestOrderPayment(
    orderId: string,
    actor: AuthenticatedUser
  ): Promise<PaymentRecordDetail | null> {
    const order = await this.ensurePayableOrder(orderId, actor);
    const paymentRecord = await this.prismaService.paymentRecord.findFirst({
      where: {
        orderId: order.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return paymentRecord ? toPaymentRecordDetail(paymentRecord) : null;
  }

  async startMockPayment(
    orderId: string,
    actor: AuthenticatedUser
  ): Promise<MockPaymentStartResponse> {
    const order = await this.ensurePayableOrder(orderId, actor);

    if (order.status !== "PENDING_CONFIRMATION") {
      throw new ConflictException("order-is-not-awaiting-payment");
    }

    let paymentRecord = await this.prismaService.paymentRecord.findFirst({
      where: {
        orderId: order.id,
        payStatus: {
          in: [PaymentStatus.PENDING, PaymentStatus.PAID]
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!paymentRecord) {
      paymentRecord = await this.prismaService.paymentRecord.create({
        data: {
          orderId: order.id,
          payStatus: PaymentStatus.PENDING,
          amountCents: order.totalAmountCents
        }
      });
    }

    if (!paymentRecord.transactionNo) {
      paymentRecord = await this.prismaService.paymentRecord.update({
        where: {
          id: paymentRecord.id
        },
        data: {
          transactionNo: buildMockTransactionNo(order.orderNo)
        }
      });
    }

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      transactionNo: paymentRecord.transactionNo ?? buildMockTransactionNo(order.orderNo),
      payStatus: mapPaymentStatus(paymentRecord.payStatus),
      amountCents: paymentRecord.amountCents,
      paidAt: paymentRecord.paidAt?.toISOString() ?? null
    };
  }

  async handleMockPaymentCallback(
    transactionNo: string,
    actor: AuthenticatedUser
  ): Promise<OrderDetailResponse> {
    const paymentRecord = await this.getPaymentRecordWithOrder(transactionNo);

    if (!paymentRecord) {
      throw new NotFoundException("payment-record-not-found");
    }

    this.assertOrderReadable(paymentRecord.order.userId, actor);

    if (paymentRecord.payStatus === PaymentStatus.PAID) {
      return this.ordersService.getOrder(paymentRecord.orderId, actor);
    }

    if (paymentRecord.order.status !== "PENDING_CONFIRMATION") {
      await this.recordLateCallbackCompensation(
        paymentRecord,
        "order-is-not-awaiting-payment"
      );
      throw new ConflictException("order-is-not-awaiting-payment");
    }

    try {
      return await this.ordersService.confirmOrderAfterPayment(
        paymentRecord.orderId,
        paymentRecord.id,
        "mock-payment-paid"
      );
    } catch (error) {
      if (!(error instanceof ConflictException)) {
        throw error;
      }

      const latest = await this.getPaymentRecordWithOrder(transactionNo);

      if (!latest) {
        throw error;
      }

      if (latest.payStatus === PaymentStatus.PAID) {
        return this.ordersService.getOrder(latest.orderId, actor);
      }

      if (latest.order.status !== "PENDING_CONFIRMATION") {
        await this.recordLateCallbackCompensation(
          latest,
          "order-is-not-awaiting-payment"
        );
        throw new ConflictException("order-is-not-awaiting-payment");
      }

      throw error;
    }
  }

  private async ensurePayableOrder(orderId: string, actor: AuthenticatedUser) {
    const order = await this.prismaService.order.findUnique({
      where: {
        id: orderId
      },
      select: {
        id: true,
        orderNo: true,
        userId: true,
        status: true,
        bizType: true,
        totalAmountCents: true
      }
    });

    if (!order) {
      throw new NotFoundException("order-not-found");
    }

    this.assertOrderReadable(order.userId, actor);

    if (order.bizType !== "ACTIVITY_REGISTRATION") {
      throw new ConflictException("order-does-not-support-payment");
    }

    if (order.totalAmountCents <= 0) {
      throw new ConflictException("order-does-not-require-payment");
    }

    return order;
  }

  private assertOrderReadable(orderUserId: string, actor: AuthenticatedUser) {
    if (actor.role === "admin" || actor.id === orderUserId) {
      return;
    }

    throw new ForbiddenException("forbidden-order-access");
  }

  private getPaymentRecordWithOrder(transactionNo: string) {
    return this.prismaService.paymentRecord.findUnique({
      where: {
        transactionNo
      },
      include: {
        order: true
      }
    });
  }

  private async recordLateCallbackCompensation(
    paymentRecord: NonNullable<Awaited<ReturnType<PaymentsService["getPaymentRecordWithOrder"]>>>,
    reason: string
  ) {
    await this.prismaService.paymentCompensationLog.upsert({
      where: {
        transactionNo_type: {
          transactionNo: paymentRecord.transactionNo ?? buildMockTransactionNo(paymentRecord.order.orderNo),
          type: PaymentCompensationType.LATE_CALLBACK_REJECTED
        }
      },
      update: {
        reason,
        orderStatus: paymentRecord.order.status,
        paymentStatus: paymentRecord.payStatus,
        details: {
          orderId: paymentRecord.orderId,
          paymentRecordId: paymentRecord.id
        }
      },
      create: {
        orderId: paymentRecord.orderId,
        paymentRecordId: paymentRecord.id,
        transactionNo:
          paymentRecord.transactionNo ??
          buildMockTransactionNo(paymentRecord.order.orderNo),
        type: PaymentCompensationType.LATE_CALLBACK_REJECTED,
        reason,
        orderStatus: paymentRecord.order.status,
        paymentStatus: paymentRecord.payStatus,
        details: {
          orderId: paymentRecord.orderId,
          paymentRecordId: paymentRecord.id
        }
      }
    });
  }
}

function buildMockTransactionNo(orderNo: string) {
  return `mock_${orderNo}`;
}

function toPaymentRecordDetail(record: {
  id: string;
  orderId: string;
  payStatus: PaymentStatus;
  transactionNo: string | null;
  amountCents: number;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PaymentRecordDetail {
  return {
    id: record.id,
    orderId: record.orderId,
    payStatus: mapPaymentStatus(record.payStatus),
    transactionNo: record.transactionNo,
    amountCents: record.amountCents,
    paidAt: record.paidAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapPaymentStatus(
  status: PaymentStatus
): PaymentRecordDetail["payStatus"] {
  switch (status) {
    case PaymentStatus.PENDING:
      return "pending";
    case PaymentStatus.PAID:
      return "paid";
    case PaymentStatus.FAILED:
      return "failed";
    case PaymentStatus.REFUNDED:
      return "refunded";
  }
}
