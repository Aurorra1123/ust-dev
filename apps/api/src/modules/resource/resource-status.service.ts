import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, ResourceStatus as PrismaResourceStatus } from "@prisma/client";
import type {
  AdminResourceReservationStatusResponse,
  PublicResourceReservationStatusResponse
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import {
  adminResourceInclude,
  toAdminReservationRecord,
  toBookingClosureDetail,
  toChannelStatus,
  toPublicReservationRecord
} from "./resource.mapper";
import {
  computeResourceChannelSnapshot,
  getOverlappingClosures
} from "./resource-channel";

const ACADEMIC_BUFFER_MINUTES = 5;

@Injectable()
export class ResourceStatusService {
  constructor(private readonly prismaService: PrismaService) {}

  async getReservationStatus(
    resourceId: string,
    fromRaw?: string,
    toRaw?: string
  ): Promise<AdminResourceReservationStatusResponse> {
    const window = resolveReservationWindow(fromRaw, toRaw);
    const [resource, academicReservations, sportsReservations] = await Promise.all([
      this.getAdminResourceRecord(resourceId),
      this.getAcademicReservations(resourceId, window.from, window.to),
      this.getSportsReservations(resourceId, window.from, window.to)
    ]);

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      from: window.from.toISOString(),
      to: window.to.toISOString(),
      generatedAt: window.now.toISOString(),
      channelStatus: toChannelStatus(
        computeResourceChannelSnapshot(resource.releaseRules, resource.bookingClosures, window.now)
      ),
      closures: getOverlappingClosures(resource.bookingClosures, window.from, window.to).map(
        (closure) => toBookingClosureDetail(closure, window.now)
      ),
      academicReservations: academicReservations.map(toAdminReservationRecord),
      sportsReservations: sportsReservations.map(toAdminReservationRecord)
    };
  }

  async getPublicReservationStatus(
    resourceId: string,
    fromRaw?: string,
    toRaw?: string
  ): Promise<PublicResourceReservationStatusResponse> {
    const window = resolveReservationWindow(fromRaw, toRaw);
    const [resource, academicReservations, sportsReservations] = await Promise.all([
      this.getPublicResourceRecord(resourceId),
      this.getAcademicReservations(resourceId, window.from, window.to),
      this.getSportsReservations(resourceId, window.from, window.to)
    ]);

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      from: window.from.toISOString(),
      to: window.to.toISOString(),
      generatedAt: window.now.toISOString(),
      channelStatus: toChannelStatus(
        computeResourceChannelSnapshot(resource.releaseRules, resource.bookingClosures, window.now)
      ),
      closures: getOverlappingClosures(resource.bookingClosures, window.from, window.to).map(
        (closure) => toBookingClosureDetail(closure, window.now)
      ),
      academicReservations: academicReservations.map(toPublicReservationRecord),
      sportsReservations: sportsReservations.map(toPublicReservationRecord)
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

  private async getPublicResourceRecord(id: string) {
    const resource = await this.prismaService.resource.findFirst({
      where: {
        id,
        status: PrismaResourceStatus.ACTIVE,
        units: {
          some: {}
        }
      },
      include: adminResourceInclude
    });

    if (!resource) {
      throw new NotFoundException("resource-not-found");
    }

    return resource;
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

  private getAcademicReservations(resourceId: string, from: Date, to: Date) {
    return this.prismaService.academicReservation.findMany({
      where: {
        resourceId,
        endTime: {
          gt: addMinutes(from, -ACADEMIC_BUFFER_MINUTES)
        },
        startTime: {
          lt: addMinutes(to, ACADEMIC_BUFFER_MINUTES)
        },
        status: {
          in: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED, OrderStatus.NO_SHOW]
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

  private getSportsReservations(resourceId: string, from: Date, to: Date) {
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
          in: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED, OrderStatus.NO_SHOW]
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
}

function resolveReservationWindow(fromRaw?: string, toRaw?: string) {
  const now = new Date();
  const from = fromRaw ? new Date(fromRaw) : now;
  const to = toRaw ? new Date(toRaw) : addDays(now, 7);

  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    to.getTime() <= from.getTime()
  ) {
    throw new BadRequestException("resource-reservation-status-invalid-range");
  }

  return {
    now,
    from,
    to
  };
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

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}
