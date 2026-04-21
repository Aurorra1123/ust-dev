import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  Prisma,
  ResourceType as PrismaResourceType
} from "@prisma/client";
import type {
  AdminBulkMutationResponse,
  AdminResourceDetailResponse,
  ResourceBookingClosureDetail,
  ResourceReleaseFrequency,
  ResourceReleaseRuleDetail
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CreateResourceBookingClosureDto } from "./dto/create-resource-booking-closure.dto";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { CreateResourceGroupDto } from "./dto/create-resource-group.dto";
import { CreateResourceReleaseRuleDto } from "./dto/create-resource-release-rule.dto";
import { CreateResourceUnitDto } from "./dto/create-resource-unit.dto";
import { UpdateResourceBookingClosureDto } from "./dto/update-resource-booking-closure.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { UpdateResourceReleaseRuleDto } from "./dto/update-resource-release-rule.dto";
import {
  mapPrismaReleaseFrequency,
  mapSharedAvailabilityMode,
  mapSharedReleaseFrequency,
  mapSharedResourceStatus,
  mapSharedResourceType,
  toBookingClosureDetail,
  toReleaseRuleDetail
} from "./resource.mapper";
import { ResourceReadService } from "./resource-read.service";

@Injectable()
export class ResourceWriteService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly resourceReadService: ResourceReadService
  ) {}

  async createResource(
    payload: CreateResourceDto
  ): Promise<AdminResourceDetailResponse> {
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

      return this.resourceReadService.getAdminResourceDetail(resource.id);
    } catch (error) {
      handlePrismaConflict(error, "resource-code-conflict");
      throw error;
    }
  }

  async updateResource(
    id: string,
    payload: UpdateResourceDto
  ): Promise<AdminResourceDetailResponse> {
    await this.ensureResourceExists(id);

    try {
      await this.prismaService.resource.update({
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
        }
      });

      return this.resourceReadService.getAdminResourceDetail(id);
    } catch (error) {
      handlePrismaConflict(error, "resource-code-conflict");
      throw error;
    }
  }

  async createResourceUnit(
    resourceId: string,
    payload: CreateResourceUnitDto
  ): Promise<AdminResourceDetailResponse> {
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

    return this.resourceReadService.getAdminResourceDetail(resourceId);
  }

  async createResourceGroup(
    resourceId: string,
    payload: CreateResourceGroupDto
  ): Promise<AdminResourceDetailResponse> {
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

    return this.resourceReadService.getAdminResourceDetail(resourceId);
  }

  async createReleaseRules(
    payload: CreateResourceReleaseRuleDto
  ): Promise<AdminBulkMutationResponse> {
    const resourceIds = Array.from(new Set(payload.resourceIds));
    await this.ensureResourcesExist(resourceIds);
    const normalized = normalizeReleaseRulePayload(payload);

    await this.prismaService.resourceReleaseRule.createMany({
      data: resourceIds.map((resourceId) => ({
        resourceId,
        frequency: normalized.frequency,
        dayOfWeek: normalized.dayOfWeek,
        dayOfMonth: normalized.dayOfMonth,
        hour: normalized.hour,
        minute: normalized.minute,
        isActive: normalized.isActive
      }))
    });

    return {
      createdCount: resourceIds.length
    };
  }

  async updateReleaseRule(
    id: string,
    payload: UpdateResourceReleaseRuleDto
  ): Promise<ResourceReleaseRuleDetail> {
    const existing = await this.prismaService.resourceReleaseRule.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException("resource-release-rule-not-found");
    }

    const normalized = normalizeReleaseRulePayload({
      resourceIds: [existing.resourceId],
      frequency: mapPrismaReleaseFrequency(existing.frequency),
      dayOfWeek: existing.dayOfWeek ?? undefined,
      dayOfMonth: existing.dayOfMonth ?? undefined,
      hour: existing.hour,
      minute: existing.minute,
      isActive: existing.isActive,
      ...payload
    });

    const updated = await this.prismaService.resourceReleaseRule.update({
      where: { id },
      data: {
        frequency: normalized.frequency,
        dayOfWeek: normalized.dayOfWeek,
        dayOfMonth: normalized.dayOfMonth,
        hour: normalized.hour,
        minute: normalized.minute,
        isActive: normalized.isActive
      }
    });

    return toReleaseRuleDetail(updated, new Date());
  }

  async createBookingClosures(
    payload: CreateResourceBookingClosureDto
  ): Promise<AdminBulkMutationResponse> {
    const resourceIds = Array.from(new Set(payload.resourceIds));
    await this.ensureResourcesExist(resourceIds);
    const startsAt = new Date(payload.startsAt);
    const endsAt = payload.endsAt ? new Date(payload.endsAt) : null;

    if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException("resource-booking-closure-invalid-range");
    }

    await this.prismaService.resourceBookingClosure.createMany({
      data: resourceIds.map((resourceId) => ({
        resourceId,
        startsAt,
        endsAt,
        reason: payload.reason,
        isActive: payload.isActive ?? true
      }))
    });

    return {
      createdCount: resourceIds.length
    };
  }

  async updateBookingClosure(
    id: string,
    payload: UpdateResourceBookingClosureDto
  ): Promise<ResourceBookingClosureDetail> {
    const existing = await this.prismaService.resourceBookingClosure.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException("resource-booking-closure-not-found");
    }

    const startsAt = payload.startsAt ? new Date(payload.startsAt) : existing.startsAt;
    const endsAt =
      payload.endsAt === undefined
        ? existing.endsAt
        : payload.endsAt === null
          ? null
          : new Date(payload.endsAt);

    if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException("resource-booking-closure-invalid-range");
    }

    const updated = await this.prismaService.resourceBookingClosure.update({
      where: { id },
      data: {
        startsAt,
        endsAt,
        reason: payload.reason ?? existing.reason,
        isActive: payload.isActive ?? existing.isActive
      }
    });

    return toBookingClosureDetail(updated, new Date());
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

  private async ensureResourcesExist(resourceIds: string[]) {
    const resources = await this.prismaService.resource.findMany({
      where: {
        id: {
          in: resourceIds
        }
      },
      select: {
        id: true
      }
    });

    if (resources.length !== resourceIds.length) {
      throw new NotFoundException("resource-not-found");
    }
  }
}

function normalizeReleaseRulePayload(
  payload:
    | CreateResourceReleaseRuleDto
    | (UpdateResourceReleaseRuleDto & {
        resourceIds: string[];
        frequency: ResourceReleaseFrequency;
        hour: number;
        minute: number;
        isActive?: boolean;
      })
) {
  if (payload.frequency === "weekly" && payload.dayOfWeek === undefined) {
    throw new BadRequestException("resource-release-rule-day-of-week-required");
  }

  if (payload.frequency === "weekly" && payload.dayOfWeek === null) {
    throw new BadRequestException("resource-release-rule-day-of-week-required");
  }

  if (payload.frequency === "monthly" && payload.dayOfMonth === undefined) {
    throw new BadRequestException("resource-release-rule-day-of-month-required");
  }

  if (payload.frequency === "monthly" && payload.dayOfMonth === null) {
    throw new BadRequestException("resource-release-rule-day-of-month-required");
  }

  return {
    frequency: mapSharedReleaseFrequency(payload.frequency),
    dayOfWeek: payload.frequency === "weekly" ? payload.dayOfWeek ?? null : null,
    dayOfMonth:
      payload.frequency === "monthly" ? payload.dayOfMonth ?? null : null,
    hour: payload.hour,
    minute: payload.minute,
    isActive: payload.isActive ?? true
  };
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
