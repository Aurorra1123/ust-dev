import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { OrderExpirationWorkerService } from "./modules/orders/order-expiration-worker.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment
    }),
    InfrastructureModule,
    AuthModule,
    OrdersModule
  ],
  providers: [OrderExpirationWorkerService]
})
export class WorkerModule {}
