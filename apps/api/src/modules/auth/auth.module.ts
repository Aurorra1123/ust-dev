import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";

import { AccessTokenGuard } from "./access-token.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { InternalJobGuard } from "./internal-job.guard";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenGuard,
    RolesGuard,
    InternalJobGuard,
    Reflector
  ],
  exports: [AuthService, AccessTokenGuard, RolesGuard, InternalJobGuard]
})
export class AuthModule {}
