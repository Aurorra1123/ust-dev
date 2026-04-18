import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import type {
  ResourceDetailResponse,
  ResourceListItem
} from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { CreateResourceGroupDto } from "./dto/create-resource-group.dto";
import { CreateResourceUnitDto } from "./dto/create-resource-unit.dto";
import { ListResourcesQueryDto } from "./dto/list-resources-query.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
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
  listResources(): Promise<ResourceDetailResponse[]> {
    return this.resourceService.listAdminResources();
  }

  @Post()
  createResource(
    @Body() payload: CreateResourceDto
  ): Promise<ResourceDetailResponse> {
    return this.resourceService.createResource(payload);
  }

  @Patch(":id")
  updateResource(
    @Param("id") id: string,
    @Body() payload: UpdateResourceDto
  ): Promise<ResourceDetailResponse> {
    return this.resourceService.updateResource(id, payload);
  }

  @Post(":id/units")
  createResourceUnit(
    @Param("id") id: string,
    @Body() payload: CreateResourceUnitDto
  ): Promise<ResourceDetailResponse> {
    return this.resourceService.createResourceUnit(id, payload);
  }

  @Post(":id/groups")
  createResourceGroup(
    @Param("id") id: string,
    @Body() payload: CreateResourceGroupDto
  ): Promise<ResourceDetailResponse> {
    return this.resourceService.createResourceGroup(id, payload);
  }
}
