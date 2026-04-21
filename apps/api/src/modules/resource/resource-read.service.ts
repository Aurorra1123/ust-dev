import { Injectable, NotFoundException } from "@nestjs/common";
import { ResourceStatus as PrismaResourceStatus } from "@prisma/client";
import type {
  AdminResourceDetailResponse,
  ResourceDetailResponse,
  ResourceListItem,
  ResourceType
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import {
  adminResourceInclude,
  mapSharedResourceType,
  resourceDetailInclude,
  toAdminResourceDetail,
  toResourceBase,
  toResourceDetail,
  toResourceUnit
} from "./resource.mapper";

@Injectable()
export class ResourceReadService {
  constructor(private readonly prismaService: PrismaService) {}

  async listAdminResources(): Promise<AdminResourceDetailResponse[]> {
    const resources = await this.prismaService.resource.findMany({
      include: adminResourceInclude,
      orderBy: [{ type: "asc" }, { name: "asc" }]
    });
    const now = new Date();

    return resources.map((resource) => toAdminResourceDetail(resource, now));
  }

  async listResources(type?: ResourceType): Promise<ResourceListItem[]> {
    const resources = await this.prismaService.resource.findMany({
      where: {
        status: PrismaResourceStatus.ACTIVE,
        units: {
          some: {}
        },
        ...(type ? { type: mapSharedResourceType(type) } : {})
      },
      include: resourceDetailInclude,
      orderBy: [{ type: "asc" }, { name: "asc" }]
    });

    return resources.map((resource) => ({
      ...toResourceBase(resource),
      unitCount: resource.units.length,
      groupCount: resource.groups.length,
      units: resource.units.map(toResourceUnit)
    }));
  }

  async getResourceDetail(id: string): Promise<ResourceDetailResponse> {
    const resource = await this.prismaService.resource.findFirst({
      where: {
        id,
        status: PrismaResourceStatus.ACTIVE,
        units: {
          some: {}
        }
      },
      include: resourceDetailInclude
    });

    if (!resource) {
      throw new NotFoundException("resource-not-found");
    }

    return toResourceDetail(resource);
  }

  async getAdminResourceDetail(id: string): Promise<AdminResourceDetailResponse> {
    const resource = await this.prismaService.resource.findUnique({
      where: { id },
      include: adminResourceInclude
    });

    if (!resource) {
      throw new NotFoundException("resource-not-found");
    }

    return toAdminResourceDetail(resource, new Date());
  }
}
