import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import type {
  AdminBulkMutationResponse,
  AdminResourceDetailResponse,
  AdminResourceReservationStatusResponse,
  ResourceBookingClosureDetail,
  ResourceDetailResponse,
  ResourceReleaseRuleDetail,
  ResourceListItem
} from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { CreateResourceGroupDto } from "./dto/create-resource-group.dto";
import { CreateResourceBookingClosureDto } from "./dto/create-resource-booking-closure.dto";
import { CreateResourceReleaseRuleDto } from "./dto/create-resource-release-rule.dto";
import { CreateResourceUnitDto } from "./dto/create-resource-unit.dto";
import { ListResourcesQueryDto } from "./dto/list-resources-query.dto";
import { ResourceReservationStatusQueryDto } from "./dto/resource-reservation-status-query.dto";
import { UpdateResourceBookingClosureDto } from "./dto/update-resource-booking-closure.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { UpdateResourceReleaseRuleDto } from "./dto/update-resource-release-rule.dto";
import { ResourceService } from "./resource.service";

@Controller("resources")
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  listResources(
    @Query() query: ListResourcesQueryDto
  ): Promise<ResourceListItem[]> {
    return this.resourceService.listResources(query.type);
  }

  @Get(":id")
  getResource(@Param("id") id: string): Promise<ResourceDetailResponse> {
    return this.resourceService.getResourceDetail(id);
  }
}

@Controller("admin/resources")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  listResources(): Promise<AdminResourceDetailResponse[]> {
    return this.resourceService.listAdminResources();
  }

  @Post()
  createResource(
    @Body() payload: CreateResourceDto
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceService.createResource(payload);
  }

  @Patch(":id")
  updateResource(
    @Param("id") id: string,
    @Body() payload: UpdateResourceDto
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceService.updateResource(id, payload);
  }

  @Post(":id/units")
  createResourceUnit(
    @Param("id") id: string,
    @Body() payload: CreateResourceUnitDto
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceService.createResourceUnit(id, payload);
  }

  @Post(":id/groups")
  createResourceGroup(
    @Param("id") id: string,
    @Body() payload: CreateResourceGroupDto
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceService.createResourceGroup(id, payload);
  }

  @Post("release-rules")
  createReleaseRules(
    @Body() payload: CreateResourceReleaseRuleDto
  ): Promise<AdminBulkMutationResponse> {
    return this.resourceService.createReleaseRules(payload);
  }

  @Patch("release-rules/:id")
  updateReleaseRule(
    @Param("id") id: string,
    @Body() payload: UpdateResourceReleaseRuleDto
  ): Promise<ResourceReleaseRuleDetail> {
    return this.resourceService.updateReleaseRule(id, payload);
  }

  @Post("closures")
  createBookingClosures(
    @Body() payload: CreateResourceBookingClosureDto
  ): Promise<AdminBulkMutationResponse> {
    return this.resourceService.createBookingClosures(payload);
  }

  @Patch("closures/:id")
  updateBookingClosure(
    @Param("id") id: string,
    @Body() payload: UpdateResourceBookingClosureDto
  ): Promise<ResourceBookingClosureDetail> {
    return this.resourceService.updateBookingClosure(id, payload);
  }

  @Get(":id/reservation-status")
  getReservationStatus(
    @Param("id") id: string,
    @Query() query: ResourceReservationStatusQueryDto
  ): Promise<AdminResourceReservationStatusResponse> {
    return this.resourceService.getReservationStatus(id, query.from, query.to);
  }
}
