import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import {
  AdminResourceController,
  ResourceController
} from "./resource.controller";
import { ResourceReadService } from "./resource-read.service";
import { ResourceStatusService } from "./resource-status.service";
import { ResourceWriteService } from "./resource-write.service";

@Module({
  imports: [AuthModule],
  controllers: [ResourceController, AdminResourceController],
  providers: [ResourceReadService, ResourceWriteService, ResourceStatusService]
})
export class ResourceModule {}
