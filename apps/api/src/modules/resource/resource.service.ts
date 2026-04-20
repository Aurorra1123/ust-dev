import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  Prisma,
  ResourceAvailabilityMode as PrismaResourceAvailabilityMode,
  ResourceReleaseFrequency as PrismaResourceReleaseFrequency,
  ResourceStatus as PrismaResourceStatus,
  ResourceType as PrismaResourceType
} from "@prisma/client";
import type {
  AdminBulkMutationResponse,
  AdminResourceDetailResponse,
  AdminResourceReservationRecord,
  AdminResourceReservationStatusResponse,
  ResourceAvailabilityMode,
  ResourceBookingClosureDetail,
  ResourceChannelSnapshot,
  ResourceDetailResponse,
  ResourceListItem,
  ResourceReleaseFrequency,
  ResourceReleaseRuleDetail,
  ResourceStatus,
  ResourceType
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import {
  computeResourceChannelSnapshot,
  getOverlappingClosures,
  getReleaseCycleMoments
} from "./resource-channel";
import { CreateResourceBookingClosureDto } from "./dto/create-resource-booking-closure.dto";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { CreateResourceGroupDto } from "./dto/create-resource-group.dto";
import { CreateResourceReleaseRuleDto } from "./dto/create-resource-release-rule.dto";
import { CreateResourceUnitDto } from "./dto/create-resource-unit.dto";
import { UpdateResourceBookingClosureDto } from "./dto/update-resource-booking-closure.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { UpdateResourceReleaseRuleDto } from "./dto/update-resource-release-rule.dto";

const adminResourceInclude = {
  units: {
    orderBy: {
      sortOrder: "asc" as const
    }
  },
  groups: {
    include: {
      items: {
        orderBy: {
          sortOrder: "asc" as const
        }
      }
    },
    orderBy: {
      name: "asc" as const
    }
  },
  releaseRules: {
    orderBy: [{ frequency: "asc" as const }, { hour: "asc" as const }, { minute: "asc" as const }]
  },
  bookingClosures: {
    orderBy: {
      startsAt: "desc" as const
    }
  }
} satisfies Prisma.ResourceInclude;

type AdminResourceRecord = Prisma.ResourceGetPayload<{
  include: typeof adminResourceInclude;
}>;

@Injectable()
export class ResourceService {
  constructor(private readonly prismaService: PrismaService) {}

  async listAdminResources(): Promise<AdminResourceDetailResponse[]> {
    const resources = await this.prismaService.resource.findMany({
      include: adminResourceInclude,
      orderBy: [{ type: "asc" }, { name: "asc" }]
    });

    return resources.map((resource) => toAdminResourceDetail(resource, new Date()));
  }

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

      return this.getAdminResourceDetail(resource.id);
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

      return this.getAdminResourceDetail(id);
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

    return this.getAdminResourceDetail(resourceId);
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

    return this.getAdminResourceDetail(resourceId);
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

  async getReservationStatus(
    resourceId: string,
    fromRaw?: string,
    toRaw?: string
  ): Promise<AdminResourceReservationStatusResponse> {
    const [resource, academicReservations, sportsReservations] = await Promise.all([
      this.getAdminResourceRecord(resourceId),
      this.getAcademicReservations(resourceId, fromRaw, toRaw),
      this.getSportsReservations(resourceId, fromRaw, toRaw)
    ]);

    const now = new Date();
    const from = fromRaw ? new Date(fromRaw) : now;
    const to = toRaw ? new Date(toRaw) : addDays(now, 7);

    if (to.getTime() <= from.getTime()) {
      throw new BadRequestException("resource-reservation-status-invalid-range");
    }

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      from: from.toISOString(),
      to: to.toISOString(),
      generatedAt: now.toISOString(),
      channelStatus: toChannelStatus(
        computeResourceChannelSnapshot(resource.releaseRules, resource.bookingClosures, now)
      ),
      closures: getOverlappingClosures(resource.bookingClosures, from, to).map((closure) =>
        toBookingClosureDetail(closure, now)
      ),
      academicReservations: academicReservations.map(toAdminReservationRecord),
      sportsReservations: sportsReservations.map(toAdminReservationRecord)
    };
  }

  async getResourceChannelGuard(resourceIds: string[], now = new Date()) {
    const resources = await this.prismaService.resource.findMany({
      where: {
        id: {
          in: resourceIds
        }
      },
      include: {
        releaseRules: true,
        bookingClosures: true
      }
    });

    if (resources.length !== resourceIds.length) {
      throw new NotFoundException("resource-not-found");
    }

    return resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      snapshot: computeResourceChannelSnapshot(
        resource.releaseRules,
        resource.bookingClosures,
        now
      ),
      releaseRules: resource.releaseRules,
      bookingClosures: resource.bookingClosures
    }));
  }

  private async getAdminResourceDetail(id: string) {
    const resource = await this.getAdminResourceRecord(id);
    return toAdminResourceDetail(resource, new Date());
  }

  private async getAdminResourceRecord(id: string) {
    const resource = await this.prismaService.resource.findUnique({
      where: { id },
      include: adminResourceInclude
    });

    if (!resource) {
      throw new NotFoundException("resource-not-found");
    }

    return resource;
  }

  private async getAcademicReservations(
    resourceId: string,
    fromRaw?: string,
    toRaw?: string
  ) {
    const now = new Date();
    const from = fromRaw ? new Date(fromRaw) : now;
    const to = toRaw ? new Date(toRaw) : addDays(now, 7);

    return this.prismaService.academicReservation.findMany({
      where: {
        resourceId,
        endTime: {
          gt: from
        },
        startTime: {
          lt: to
        },
        status: {
          in: [
            "PENDING_CONFIRMATION",
            "CONFIRMED",
            "NO_SHOW"
          ]
        }
      },
      include: {
        order: {
          include: {
            user: true,
            reservationParticipants: true
          }
        },
        resourceUnit: true
      },
      orderBy: {
        startTime: "asc"
      }
    });
  }

  private async getSportsReservations(
    resourceId: string,
    fromRaw?: string,
    toRaw?: string
  ) {
    const now = new Date();
    const from = fromRaw ? new Date(fromRaw) : now;
    const to = toRaw ? new Date(toRaw) : addDays(now, 7);

    return this.prismaService.sportsReservationSlot.findMany({
      where: {
        resourceId,
        slotEnd: {
          gt: from
        },
        slotStart: {
          lt: to
        },
        status: {
          in: [
            "PENDING_CONFIRMATION",
            "CONFIRMED",
            "NO_SHOW"
          ]
        }
      },
      include: {
        order: {
          include: {
            user: true,
            reservationParticipants: true
          }
        },
        resourceUnit: true
      },
      orderBy: {
        slotStart: "asc"
      }
    });
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

function toAdminResourceDetail(
  resource: AdminResourceRecord,
  now: Date
): AdminResourceDetailResponse {
  return {
    ...toResourceDetail(resource),
    releaseRules: resource.releaseRules.map((rule) => toReleaseRuleDetail(rule, now)),
    bookingClosures: resource.bookingClosures.map((closure) =>
      toBookingClosureDetail(closure, now)
    ),
    channelStatus: toChannelStatus(
      computeResourceChannelSnapshot(resource.releaseRules, resource.bookingClosures, now)
    )
  };
}

function toReleaseRuleDetail(
  rule: {
    id: string;
    resourceId: string;
    frequency: PrismaResourceReleaseFrequency;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    hour: number;
    minute: number;
    isActive: boolean;
  },
  now: Date
): ResourceReleaseRuleDetail {
  const moments = getReleaseCycleMoments(rule, now);

  return {
    id: rule.id,
    resourceId: rule.resourceId,
    frequency: mapPrismaReleaseFrequency(rule.frequency),
    dayOfWeek: rule.dayOfWeek,
    dayOfMonth: rule.dayOfMonth,
    hour: rule.hour,
    minute: rule.minute,
    isActive: rule.isActive,
    currentCycleReleaseAt: moments.currentCycleReleaseAt.toISOString(),
    nextReleaseAt: moments.nextReleaseAt.toISOString()
  };
}

function toBookingClosureDetail(
  closure: {
    id?: string;
    resourceId?: string;
    startsAt: Date;
    endsAt: Date | null;
    reason: string | null;
    isActive: boolean;
  },
  now: Date
): ResourceBookingClosureDetail {
  const isCurrentlyClosed =
    closure.isActive &&
    closure.startsAt.getTime() <= now.getTime() &&
    (closure.endsAt === null || closure.endsAt.getTime() > now.getTime());

  return {
    id: closure.id ?? "",
    resourceId: closure.resourceId ?? "",
    startsAt: closure.startsAt.toISOString(),
    endsAt: closure.endsAt?.toISOString() ?? null,
    reason: closure.reason,
    isActive: closure.isActive,
    isCurrentlyClosed
  };
}

function toChannelStatus(snapshot: {
  status: "OPEN" | "CLOSED" | "SCHEDULED";
  currentCycleReleaseAt: Date | null;
  nextReleaseAt: Date | null;
  activeClosureReason: string | null;
  activeClosureEndsAt: Date | null;
}): ResourceChannelSnapshot {
  return {
    status:
      snapshot.status === "OPEN"
        ? "open"
        : snapshot.status === "CLOSED"
          ? "closed"
          : "scheduled",
    currentCycleReleaseAt: snapshot.currentCycleReleaseAt?.toISOString() ?? null,
    nextReleaseAt: snapshot.nextReleaseAt?.toISOString() ?? null,
    activeClosureReason: snapshot.activeClosureReason,
    activeClosureEndsAt: snapshot.activeClosureEndsAt?.toISOString() ?? null
  };
}

function toAdminReservationRecord(
  reservation:
    | Prisma.AcademicReservationGetPayload<{
        include: {
          order: {
            include: {
              user: true;
              reservationParticipants: true;
            };
          };
          resourceUnit: true;
        };
      }>
    | Prisma.SportsReservationSlotGetPayload<{
        include: {
          order: {
            include: {
              user: true;
              reservationParticipants: true;
            };
          };
          resourceUnit: true;
        };
      }>
): AdminResourceReservationRecord {
  const isAcademic = "startTime" in reservation;
  const startTime = isAcademic ? reservation.startTime : reservation.slotStart;
  const endTime = isAcademic ? reservation.endTime : reservation.slotEnd;

  return {
    orderId: reservation.orderId,
    orderNo: reservation.order.orderNo,
    userId: reservation.order.userId,
    userEmail: reservation.order.user.email,
    status: mapPrismaOrderStatus(reservation.status),
    resourceUnitId: reservation.resourceUnitId,
    resourceUnitName: reservation.resourceUnit.name,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    participantCount: reservation.order.reservationParticipants.length,
    checkedInCount: reservation.order.reservationParticipants.filter(
      (participant) => participant.checkedInAt !== null
    ).length
  };
}

function normalizeReleaseRulePayload(
  payload:
    | CreateResourceReleaseRuleDto
    | (UpdateResourceReleaseRuleDto & {
        resourceIds: string[];
        frequency: "daily" | "weekly" | "monthly";
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

function mapSharedReleaseFrequency(value: ResourceReleaseFrequency) {
  switch (value) {
    case "daily":
      return PrismaResourceReleaseFrequency.DAILY;
    case "weekly":
      return PrismaResourceReleaseFrequency.WEEKLY;
    case "monthly":
      return PrismaResourceReleaseFrequency.MONTHLY;
  }
}

function mapPrismaReleaseFrequency(
  value: PrismaResourceReleaseFrequency
): ResourceReleaseFrequency {
  switch (value) {
    case PrismaResourceReleaseFrequency.DAILY:
      return "daily";
    case PrismaResourceReleaseFrequency.WEEKLY:
      return "weekly";
    case PrismaResourceReleaseFrequency.MONTHLY:
      return "monthly";
  }
}

function mapPrismaOrderStatus(
  value: "PENDING_CONFIRMATION" | "CONFIRMED" | "CANCELLED" | "NO_SHOW"
) {
  switch (value) {
    case "PENDING_CONFIRMATION":
      return "pending_confirmation";
    case "CONFIRMED":
      return "confirmed";
    case "CANCELLED":
      return "cancelled";
    case "NO_SHOW":
      return "no_show";
  }
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

function addDays(value: Date, days: number) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate() + days,
    value.getHours(),
    value.getMinutes(),
    value.getSeconds(),
    value.getMilliseconds()
  );
}
