import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { OrdersModule } from "../orders/orders.module";
import { RulesModule } from "../rules/rules.module";
import { ReservationController } from "./reservation.controller";
import { ReservationService } from "./reservation.service";

@Module({
  imports: [AuthModule, OrdersModule, RulesModule],
  controllers: [ReservationController],
  providers: [ReservationService]
})
export class ReservationModule {}
