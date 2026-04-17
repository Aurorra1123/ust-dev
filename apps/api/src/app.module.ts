import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { ActivitiesModule } from "./modules/activities/activities.module";
import { AppController } from "./modules/app/app.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { ReservationModule } from "./modules/reservation/reservation.module";
import { ResourceModule } from "./modules/resource/resource.module";
import { RulesModule } from "./modules/rules/rules.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment
    }),
    InfrastructureModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ResourceModule,
    ReservationModule,
    ActivitiesModule,
    OrdersModule,
    RulesModule
  ],
  controllers: [AppController]
})
export class AppModule {}
