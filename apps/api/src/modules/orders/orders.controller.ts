import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { OrderDetailResponse } from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { InternalJobGuard } from "../auth/internal-job.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { TransitionOrderDto } from "./dto/transition-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  listOrders(@CurrentUser() currentUser: AuthenticatedUser): Promise<OrderDetailResponse[]> {
    return this.ordersService.listOrders(currentUser);
  }

  @Get(":id")
  @UseGuards(AccessTokenGuard)
  getOrder(
    @Param("id") orderId: string,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.ordersService.getOrder(orderId, currentUser);
  }

  @Post(":id/confirm")
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("admin")
  confirmOrder(
    @Param("id") orderId: string,
    @Body() dto: TransitionOrderDto
  ) {
    return this.ordersService.confirmOrder(orderId, dto.reason);
  }

  @Post(":id/cancel")
  @UseGuards(AccessTokenGuard)
  cancelOrder(
    @Param("id") orderId: string,
    @Body() dto: TransitionOrderDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.ordersService.cancelOrder(
      orderId,
      currentUser,
      dto.reason ?? "user-cancelled"
    );
  }

  @Post(":id/no-show")
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("admin")
  markNoShow(
    @Param("id") orderId: string,
    @Body() dto: TransitionOrderDto
  ) {
    return this.ordersService.markNoShow(orderId, dto.reason);
  }

  @Post("jobs/expire-pending")
  @UseGuards(InternalJobGuard)
  expirePendingOrders() {
    return this.ordersService.expirePendingOrders();
  }
}
