import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import {
  AdminResourceController,
  ResourceController
} from "./resource.controller";
import { ResourceService } from "./resource.service";

@Module({
  imports: [AuthModule],
  controllers: [ResourceController, AdminResourceController],
  providers: [ResourceService]
})
export class ResourceModule {}
