import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import {
  AdminServiceRequestsController,
  ServiceRequestsController
} from "./service-requests.controller";
import { ServiceRequestsService } from "./service-requests.service";

@Module({
  imports: [AuthModule],
  controllers: [ServiceRequestsController, AdminServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService]
})
export class ServiceRequestsModule {}
