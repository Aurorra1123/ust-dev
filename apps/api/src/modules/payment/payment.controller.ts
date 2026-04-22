import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type {
  MockPaymentStartResponse,
  OrderDetailResponse,
  PaymentRecordDetail
} from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { MockPaymentCallbackDto } from "./dto/mock-payment-callback.dto";
import { PaymentsService } from "./payment.service";

@Controller("payments")
@UseGuards(AccessTokenGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("orders/:orderId")
  getOrderPayment(
    @Param("orderId") orderId: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<PaymentRecordDetail | null> {
    return this.paymentsService.getLatestOrderPayment(orderId, currentUser);
  }

  @Post("orders/:orderId/mock")
  startMockPayment(
    @Param("orderId") orderId: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<MockPaymentStartResponse> {
    return this.paymentsService.startMockPayment(orderId, currentUser);
  }

  @Post("mock/callback")
  handleMockPaymentCallback(
    @Body() payload: MockPaymentCallbackDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<OrderDetailResponse> {
    return this.paymentsService.handleMockPaymentCallback(
      payload.transactionNo,
      currentUser
    );
  }
}
