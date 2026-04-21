import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { AppServiceRequest } from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { UpdateServiceRequestDto } from "./dto/update-service-request.dto";
import { ServiceRequestsService } from "./service-requests.service";

@Controller("service-requests")
@UseGuards(AccessTokenGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  listUserServiceRequests(
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<AppServiceRequest[]> {
    return this.serviceRequestsService.listUserServiceRequests(currentUser);
  }

  @Post()
  createServiceRequest(
    @Body() payload: CreateServiceRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ): Promise<AppServiceRequest> {
    return this.serviceRequestsService.createServiceRequest(payload, currentUser);
  }
}

@Controller("admin/service-requests")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  listAdminServiceRequests(): Promise<AppServiceRequest[]> {
    return this.serviceRequestsService.listAdminServiceRequests();
  }

  @Patch(":id")
  updateServiceRequest(
    @Param("id") id: string,
    @Body() payload: UpdateServiceRequestDto
  ): Promise<AppServiceRequest> {
    return this.serviceRequestsService.updateServiceRequest(id, payload);
  }
}
