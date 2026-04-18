import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  Prisma,
  ResourceAvailabilityMode as PrismaResourceAvailabilityMode,
  ResourceStatus as PrismaResourceStatus,
  ResourceType as PrismaResourceType
} from "@prisma/client";
import type {
  ResourceAvailabilityMode,
  ResourceDetailResponse,
  ResourceListItem,
  ResourceStatus,
  ResourceType
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { CreateResourceGroupDto } from "./dto/create-resource-group.dto";
import { CreateResourceUnitDto } from "./dto/create-resource-unit.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";

@Injectable()
export class ResourceService {
  constructor(private readonly prismaService: PrismaService) {}

  async listResources(type?: ResourceType): Promise<ResourceListItem[]> {
    const resources = await this.prismaService.resource.findMany({
      where: {
        status: PrismaResourceStatus.ACTIVE,
        ...(type ? { type: mapSharedResourceType(type) } : {})
      },
      include: {
        units: {
          orderBy: {
            sortOrder: "asc"
          }
        },
        groups: {
          include: {
            items: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          }
        }
      },
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
        status: PrismaResourceStatus.ACTIVE
      },
      include: {
        units: {
          orderBy: {
            sortOrder: "asc"
          }
        },
        groups: {
          include: {
            items: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          },
          orderBy: {
            name: "asc"
          }
        }
      }
    });

    if (!resource) {
      throw new NotFoundException("resource-not-found");
    }

    return toResourceDetail(resource);
  }

  async createResource(payload: CreateResourceDto): Promise<ResourceDetailResponse> {
    try {
      const resource = await this.prismaService.resource.create({
        data: {
          type: mapSharedResourceType(payload.type),
          code: payload.code,
          name: payload.name,
          description: payload.description,
          location: payload.location,
          status: mapSharedResourceStatus(payload.status ?? "active")
        },
        select: {
          id: true
        }
      });

      return this.getAdminResourceDetail(resource.id);
    } catch (error) {
      handlePrismaConflict(error, "resource-code-conflict");
      throw error;
    }
  }

  async updateResource(
    id: string,
    payload: UpdateResourceDto
  ): Promise<ResourceDetailResponse> {
    await this.ensureResourceExists(id);

    try {
      const resource = await this.prismaService.resource.update({
        where: { id },
        data: {
          ...(payload.type ? { type: mapSharedResourceType(payload.type) } : {}),
          ...(payload.code ? { code: payload.code } : {}),
          ...(payload.name ? { name: payload.name } : {}),
          ...(payload.description !== undefined
            ? { description: payload.description }
            : {}),
          ...(payload.location !== undefined ? { location: payload.location } : {}),
          ...(payload.status
            ? { status: mapSharedResourceStatus(payload.status) }
            : {})
        },
        include: {
          units: {
            orderBy: {
              sortOrder: "asc"
            }
          },
          groups: {
            include: {
              items: {
                orderBy: {
                  sortOrder: "asc"
                }
              }
            },
            orderBy: {
              name: "asc"
            }
          }
        }
      });

      return toResourceDetail(resource);
    } catch (error) {
      handlePrismaConflict(error, "resource-code-conflict");
      throw error;
    }
  }

  async createResourceUnit(
    resourceId: string,
    payload: CreateResourceUnitDto
  ): Promise<ResourceDetailResponse> {
    const resource = await this.ensureResourceExists(resourceId);
    validateUnitAvailabilityMode(resource.type, payload.availabilityMode);

    try {
      await this.prismaService.resourceUnit.create({
        data: {
          resourceId,
          code: payload.code,
          name: payload.name,
          unitType: payload.unitType,
          availabilityMode: mapSharedAvailabilityMode(payload.availabilityMode),
          capacity: payload.capacity,
          sortOrder: payload.sortOrder ?? 0
        }
      });
    } catch (error) {
      handlePrismaConflict(error, "resource-unit-code-conflict");
      throw error;
    }

    return this.getAdminResourceDetail(resourceId);
  }

  async createResourceGroup(
    resourceId: string,
    payload: CreateResourceGroupDto
  ): Promise<ResourceDetailResponse> {
    const resource = await this.ensureResourceExists(resourceId);

    if (resource.type !== PrismaResourceType.SPORTS_FACILITY) {
      throw new BadRequestException("resource-group-only-supported-for-sports");
    }

    const uniqueUnitIds = Array.from(new Set(payload.unitIds));
    const units = await this.prismaService.resourceUnit.findMany({
      where: {
        id: {
          in: uniqueUnitIds
        },
        resourceId
      },
      orderBy: {
        sortOrder: "asc"
      }
    });

    if (units.length !== uniqueUnitIds.length) {
      throw new BadRequestException("resource-group-unit-mismatch");
    }

    try {
      await this.prismaService.$transaction(async (tx) => {
        const group = await tx.resourceGroup.create({
          data: {
            resourceId,
            name: payload.name,
            description: payload.description
          }
        });

        await tx.resourceGroupItem.createMany({
          data: uniqueUnitIds.map((unitId, index) => ({
            groupId: group.id,
            resourceUnitId: unitId,
            sortOrder: index + 1
          }))
        });
      });
    } catch (error) {
      handlePrismaConflict(error, "resource-group-conflict");
      throw error;
    }

    return this.getAdminResourceDetail(resourceId);
  }

  private async getAdminResourceDetail(id: string) {
    const resource = await this.prismaService.resource.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: {
            sortOrder: "asc"
          }
        },
        groups: {
          include: {
            items: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          },
          orderBy: {
            name: "asc"
          }
        }
      }
    });

    if (!resource) {
      throw new NotFoundException("resource-not-found");
    }

    return toResourceDetail(resource);
  }

  private async ensureResourceExists(id: string) {
    const resource = await this.prismaService.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      throw new NotFoundException("resource-not-found");
    }

    return resource;
  }
}

function toResourceBase(resource: {
  id: string;
  type: PrismaResourceType;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  status: PrismaResourceStatus;
}) {
  return {
    id: resource.id,
    type: mapPrismaResourceType(resource.type),
    code: resource.code,
    name: resource.name,
    description: resource.description,
    location: resource.location,
    status: mapPrismaResourceStatus(resource.status)
  };
}

function toResourceUnit(unit: {
  id: string;
  resourceId: string;
  code: string;
  name: string;
  unitType: string;
  availabilityMode: PrismaResourceAvailabilityMode;
  capacity: number | null;
  sortOrder: number;
}) {
  return {
    id: unit.id,
    resourceId: unit.resourceId,
    code: unit.code,
    name: unit.name,
    unitType: unit.unitType,
    availabilityMode: mapPrismaAvailabilityMode(unit.availabilityMode),
    capacity: unit.capacity,
    sortOrder: unit.sortOrder
  };
}

function toResourceDetail(resource: {
  id: string;
  type: PrismaResourceType;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  status: PrismaResourceStatus;
  units: Array<{
    id: string;
    resourceId: string;
    code: string;
    name: string;
    unitType: string;
    availabilityMode: PrismaResourceAvailabilityMode;
    capacity: number | null;
    sortOrder: number;
  }>;
  groups: Array<{
    id: string;
    resourceId: string;
    name: string;
    description: string | null;
    items: Array<{
      id: string;
      resourceUnitId: string;
      sortOrder: number;
    }>;
  }>;
}): ResourceDetailResponse {
  return {
    ...toResourceBase(resource),
    units: resource.units.map(toResourceUnit),
    groups: resource.groups.map((group) => ({
      id: group.id,
      resourceId: group.resourceId,
      name: group.name,
      description: group.description,
      items: group.items.map((item) => ({
        id: item.id,
        resourceUnitId: item.resourceUnitId,
        sortOrder: item.sortOrder
      }))
    }))
  };
}

function mapSharedResourceType(value: ResourceType) {
  return value === "academic_space"
    ? PrismaResourceType.ACADEMIC_SPACE
    : PrismaResourceType.SPORTS_FACILITY;
}

function mapPrismaResourceType(value: PrismaResourceType): ResourceType {
  return value === PrismaResourceType.ACADEMIC_SPACE
    ? "academic_space"
    : "sports_facility";
}

function mapSharedResourceStatus(value: ResourceStatus) {
  return value === "active"
    ? PrismaResourceStatus.ACTIVE
    : PrismaResourceStatus.INACTIVE;
}

function mapPrismaResourceStatus(value: PrismaResourceStatus): ResourceStatus {
  return value === PrismaResourceStatus.ACTIVE ? "active" : "inactive";
}

function mapSharedAvailabilityMode(
  value: "continuous" | "discrete_slot"
) {
  return value === "continuous"
    ? PrismaResourceAvailabilityMode.CONTINUOUS
    : PrismaResourceAvailabilityMode.DISCRETE_SLOT;
}

function mapPrismaAvailabilityMode(
  value: PrismaResourceAvailabilityMode
): ResourceAvailabilityMode {
  return value === PrismaResourceAvailabilityMode.CONTINUOUS
    ? "continuous"
    : "discrete_slot";
}

function validateUnitAvailabilityMode(
  resourceType: PrismaResourceType,
  availabilityMode: "continuous" | "discrete_slot"
) {
  if (
    resourceType === PrismaResourceType.ACADEMIC_SPACE &&
    availabilityMode !== "continuous"
  ) {
    throw new BadRequestException("academic-space-unit-must-be-continuous");
  }

  if (
    resourceType === PrismaResourceType.SPORTS_FACILITY &&
    availabilityMode !== "discrete_slot"
  ) {
    throw new BadRequestException("sports-unit-must-be-discrete-slot");
  }
}

function handlePrismaConflict(error: unknown, message: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new ConflictException(message);
  }
}
