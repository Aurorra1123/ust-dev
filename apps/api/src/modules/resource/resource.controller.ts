import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import type {
  AdminBulkMutationResponse,
  AdminResourceDetailResponse,
  AdminResourceReservationStatusResponse,
  PublicResourceReservationStatusResponse,
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
import { ResourceReadService } from "./resource-read.service";
import { ResourceStatusService } from "./resource-status.service";
import { ResourceWriteService } from "./resource-write.service";

@Controller("resources")
export class ResourceController {
  constructor(
    private readonly resourceReadService: ResourceReadService,
    private readonly resourceStatusService: ResourceStatusService
  ) {}

  @Get()
  listResources(
    @Query() query: ListResourcesQueryDto
  ): Promise<ResourceListItem[]> {
    return this.resourceReadService.listResources(query.type);
  }

  @Get(":id")
  getResource(@Param("id") id: string): Promise<ResourceDetailResponse> {
    return this.resourceReadService.getResourceDetail(id);
  }

  @Get(":id/reservation-status")
  getPublicReservationStatus(
    @Param("id") id: string,
    @Query() query: ResourceReservationStatusQueryDto
  ): Promise<PublicResourceReservationStatusResponse> {
    return this.resourceStatusService.getPublicReservationStatus(
      id,
      query.from,
      query.to
    );
  }
}

@Controller("admin/resources")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminResourceController {
  constructor(
    private readonly resourceReadService: ResourceReadService,
    private readonly resourceWriteService: ResourceWriteService,
    private readonly resourceStatusService: ResourceStatusService
  ) {}

  @Get()
  listResources(): Promise<AdminResourceDetailResponse[]> {
    return this.resourceReadService.listAdminResources();
  }

  @Post()
  createResource(
    @Body() payload: CreateResourceDto
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceWriteService.createResource(payload);
  }

  @Patch(":id")
  updateResource(
    @Param("id") id: string,
    @Body() payload: UpdateResourceDto
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceWriteService.updateResource(id, payload);
  }

  @Post(":id/units")
  createResourceUnit(
    @Param("id") id: string,
    @Body() payload: CreateResourceUnitDto
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceWriteService.createResourceUnit(id, payload);
  }

  @Delete(":id")
  deleteResource(@Param("id") id: string): Promise<{ id: string }> {
    return this.resourceWriteService.deleteResource(id);
  }

  @Delete(":resourceId/units/:unitId")
  deleteResourceUnit(
    @Param("resourceId") resourceId: string,
    @Param("unitId") unitId: string
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceWriteService.deleteResourceUnit(resourceId, unitId);
  }

  @Post(":id/groups")
  createResourceGroup(
    @Param("id") id: string,
    @Body() payload: CreateResourceGroupDto
  ): Promise<AdminResourceDetailResponse> {
    return this.resourceWriteService.createResourceGroup(id, payload);
  }

  @Post("release-rules")
  createReleaseRules(
    @Body() payload: CreateResourceReleaseRuleDto
  ): Promise<AdminBulkMutationResponse> {
    return this.resourceWriteService.createReleaseRules(payload);
  }

  @Patch("release-rules/:id")
  updateReleaseRule(
    @Param("id") id: string,
    @Body() payload: UpdateResourceReleaseRuleDto
  ): Promise<ResourceReleaseRuleDetail> {
    return this.resourceWriteService.updateReleaseRule(id, payload);
  }

  @Post("closures")
  createBookingClosures(
    @Body() payload: CreateResourceBookingClosureDto
  ): Promise<AdminBulkMutationResponse> {
    return this.resourceWriteService.createBookingClosures(payload);
  }

  @Patch("closures/:id")
  updateBookingClosure(
    @Param("id") id: string,
    @Body() payload: UpdateResourceBookingClosureDto
  ): Promise<ResourceBookingClosureDetail> {
    return this.resourceWriteService.updateBookingClosure(id, payload);
  }

  @Get(":id/reservation-status")
  getReservationStatus(
    @Param("id") id: string,
    @Query() query: ResourceReservationStatusQueryDto
  ): Promise<AdminResourceReservationStatusResponse> {
    return this.resourceStatusService.getReservationStatus(id, query.from, query.to);
  }
}
