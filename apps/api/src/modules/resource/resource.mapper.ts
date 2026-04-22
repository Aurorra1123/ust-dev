import {
  Prisma,
  ResourceAvailabilityMode as PrismaResourceAvailabilityMode,
  ResourceReleaseFrequency as PrismaResourceReleaseFrequency,
  ResourceStatus as PrismaResourceStatus,
  ResourceType as PrismaResourceType
} from "@prisma/client";
import type {
  AdminResourceDetailResponse,
  AdminResourceReservationRecord,
  PublicResourceReservationRecord,
  ResourceAvailabilityMode,
  ResourceBookingClosureDetail,
  ResourceChannelSnapshot,
  ResourceDetailResponse,
  ResourceReleaseFrequency,
  ResourceReleaseRuleDetail,
  ResourceStatus,
  ResourceType
} from "@campusbook/shared-types";

import { computeResourceChannelSnapshot, getReleaseCycleMoments } from "./resource-channel";

export const resourceDetailInclude = {
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
  }
} satisfies Prisma.ResourceInclude;

export const adminResourceInclude = {
  ...resourceDetailInclude,
  releaseRules: {
    orderBy: [{ frequency: "asc" as const }, { hour: "asc" as const }, { minute: "asc" as const }]
  },
  bookingClosures: {
    orderBy: {
      startsAt: "desc" as const
    }
  }
} satisfies Prisma.ResourceInclude;

export type ResourceDetailRecord = Prisma.ResourceGetPayload<{
  include: typeof resourceDetailInclude;
}>;

export type AdminResourceRecord = Prisma.ResourceGetPayload<{
  include: typeof adminResourceInclude;
}>;

type ReservationStatusRecord =
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
    }>;

export function toResourceBase(resource: {
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

export function toResourceUnit(unit: {
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

export function toResourceDetail(
  resource: ResourceDetailRecord
): ResourceDetailResponse {
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

export function toAdminResourceDetail(
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

export function toReleaseRuleDetail(
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

export function toBookingClosureDetail(
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

export function toChannelStatus(snapshot: {
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

export function toAdminReservationRecord(
  reservation: ReservationStatusRecord
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
    bufferBeforeMin: isAcademic
      ? normalizeAcademicBufferMinutes(reservation.bufferBeforeMin)
      : 0,
    bufferAfterMin: isAcademic
      ? normalizeAcademicBufferMinutes(reservation.bufferAfterMin)
      : 0,
    participantCount: reservation.order.reservationParticipants.length,
    checkedInCount: reservation.order.reservationParticipants.filter(
      (participant) => participant.checkedInAt !== null
    ).length
  };
}

export function toPublicReservationRecord(
  reservation: ReservationStatusRecord
): PublicResourceReservationRecord {
  const isAcademic = "startTime" in reservation;
  const startTime = isAcademic ? reservation.startTime : reservation.slotStart;
  const endTime = isAcademic ? reservation.endTime : reservation.slotEnd;

  return {
    orderId: reservation.orderId,
    status: mapPrismaOrderStatus(reservation.status),
    resourceUnitId: reservation.resourceUnitId,
    resourceUnitName: reservation.resourceUnit.name,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    bufferBeforeMin: isAcademic
      ? normalizeAcademicBufferMinutes(reservation.bufferBeforeMin)
      : 0,
    bufferAfterMin: isAcademic
      ? normalizeAcademicBufferMinutes(reservation.bufferAfterMin)
      : 0,
    participantCount: reservation.order.reservationParticipants.length,
    checkedInCount: reservation.order.reservationParticipants.filter(
      (participant) => participant.checkedInAt !== null
    ).length
  };
}

export function mapSharedResourceType(value: ResourceType) {
  return value === "academic_space"
    ? PrismaResourceType.ACADEMIC_SPACE
    : PrismaResourceType.SPORTS_FACILITY;
}

export function mapPrismaResourceType(value: PrismaResourceType): ResourceType {
  return value === PrismaResourceType.ACADEMIC_SPACE
    ? "academic_space"
    : "sports_facility";
}

export function mapSharedResourceStatus(value: ResourceStatus) {
  return value === "active"
    ? PrismaResourceStatus.ACTIVE
    : PrismaResourceStatus.INACTIVE;
}

export function mapPrismaResourceStatus(value: PrismaResourceStatus): ResourceStatus {
  return value === PrismaResourceStatus.ACTIVE ? "active" : "inactive";
}

export function mapSharedAvailabilityMode(
  value: "continuous" | "discrete_slot"
) {
  return value === "continuous"
    ? PrismaResourceAvailabilityMode.CONTINUOUS
    : PrismaResourceAvailabilityMode.DISCRETE_SLOT;
}

export function mapPrismaAvailabilityMode(
  value: PrismaResourceAvailabilityMode
): ResourceAvailabilityMode {
  return value === PrismaResourceAvailabilityMode.CONTINUOUS
    ? "continuous"
    : "discrete_slot";
}

export function mapSharedReleaseFrequency(value: ResourceReleaseFrequency) {
  switch (value) {
    case "daily":
      return PrismaResourceReleaseFrequency.DAILY;
    case "weekly":
      return PrismaResourceReleaseFrequency.WEEKLY;
    case "monthly":
      return PrismaResourceReleaseFrequency.MONTHLY;
  }
}

export function mapPrismaReleaseFrequency(
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

function normalizeAcademicBufferMinutes(value: number) {
  return Math.max(value, 5);
}

export function mapPrismaOrderStatus(
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
