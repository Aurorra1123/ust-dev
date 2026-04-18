import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { ActivitiesModule } from "./modules/activities/activities.module";
import { ActivityRegistrationWorkerService } from "./modules/activities/activity-registration-worker.service";
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
    ActivitiesModule,
    OrdersModule
  ],
  providers: [OrderExpirationWorkerService, ActivityRegistrationWorkerService]
})
export class WorkerModule {}
