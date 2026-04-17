import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { TransitionOrderDto } from "./dto/transition-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(":id")
  getOrder(@Param("id") orderId: string) {
    return this.ordersService.getOrder(orderId);
  }

  @Post(":id/confirm")
  confirmOrder(
    @Param("id") orderId: string,
    @Body() dto: TransitionOrderDto
  ) {
    return this.ordersService.confirmOrder(orderId, dto.reason);
  }

  @Post(":id/cancel")
  cancelOrder(
    @Param("id") orderId: string,
    @Body() dto: TransitionOrderDto
  ) {
    return this.ordersService.cancelOrder(orderId, dto.reason ?? "user-cancelled");
  }

  @Post(":id/no-show")
  markNoShow(
    @Param("id") orderId: string,
    @Body() dto: TransitionOrderDto
  ) {
    return this.ordersService.markNoShow(orderId, dto.reason);
  }

  @Post("jobs/expire-pending")
  expirePendingOrders() {
    return this.ordersService.expirePendingOrders();
  }
}
