import { Injectable, NotFoundException } from "@nestjs/common";
import { ServiceRequestStatus as PrismaServiceRequestStatus } from "@prisma/client";
import type {
  AppServiceRequest,
  AuthUser,
  ServiceRequestStatus
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { UpdateServiceRequestDto } from "./dto/update-service-request.dto";

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listUserServiceRequests(currentUser: AuthUser): Promise<AppServiceRequest[]> {
    const requests = await this.prismaService.serviceRequest.findMany({
      where: {
        userId: currentUser.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }]
    });

    return requests.map(toAppServiceRequest);
  }

  async listAdminServiceRequests(): Promise<AppServiceRequest[]> {
    const requests = await this.prismaService.serviceRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }]
    });

    return requests.map(toAppServiceRequest);
  }

  async createServiceRequest(
    payload: CreateServiceRequestDto,
    currentUser: AuthUser
  ): Promise<AppServiceRequest> {
    const request = await this.prismaService.serviceRequest.create({
      data: {
        userId: currentUser.id,
        title: payload.title.trim(),
        description: payload.description.trim(),
        location: payload.location.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return toAppServiceRequest(request);
  }

  async updateServiceRequest(
    id: string,
    payload: UpdateServiceRequestDto
  ): Promise<AppServiceRequest> {
    const existing = await this.prismaService.serviceRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!existing) {
      throw new NotFoundException("service-request-not-found");
    }

    const nextStatus = payload.status ?? mapPrismaServiceRequestStatus(existing.status);
    const now = new Date();
    const shouldSetReceivedAt =
      nextStatus === "received" ||
      nextStatus === "in_progress" ||
      nextStatus === "resolved" ||
      nextStatus === "closed";
    const shouldSetResolvedAt =
      nextStatus === "resolved" || nextStatus === "closed";

    const request = await this.prismaService.serviceRequest.update({
      where: { id },
      data: {
        ...(payload.status !== undefined
          ? {
              status: mapSharedServiceRequestStatus(payload.status),
              receivedAt: shouldSetReceivedAt ? existing.receivedAt ?? now : null,
              resolvedAt: shouldSetResolvedAt ? existing.resolvedAt ?? now : null
            }
          : {}),
        ...(payload.adminNote !== undefined
          ? { adminNote: normalizeOptionalText(payload.adminNote) }
          : {})
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return toAppServiceRequest(request);
  }
}

function toAppServiceRequest(request: {
  id: string;
  userId: string;
  title: string;
  description: string;
  location: string;
  status: PrismaServiceRequestStatus;
  adminNote: string | null;
  receivedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
  };
}): AppServiceRequest {
  return {
    id: request.id,
    userId: request.userId,
    userEmail: request.user.email,
    title: request.title,
    description: request.description,
    location: request.location,
    status: mapPrismaServiceRequestStatus(request.status),
    adminNote: request.adminNote,
    receivedAt: request.receivedAt?.toISOString() ?? null,
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  };
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapSharedServiceRequestStatus(value: ServiceRequestStatus) {
  switch (value) {
    case "submitted":
      return PrismaServiceRequestStatus.SUBMITTED;
    case "received":
      return PrismaServiceRequestStatus.RECEIVED;
    case "in_progress":
      return PrismaServiceRequestStatus.IN_PROGRESS;
    case "resolved":
      return PrismaServiceRequestStatus.RESOLVED;
    case "closed":
      return PrismaServiceRequestStatus.CLOSED;
  }
}

function mapPrismaServiceRequestStatus(
  value: PrismaServiceRequestStatus
): ServiceRequestStatus {
  switch (value) {
    case PrismaServiceRequestStatus.SUBMITTED:
      return "submitted";
    case PrismaServiceRequestStatus.RECEIVED:
      return "received";
    case PrismaServiceRequestStatus.IN_PROGRESS:
      return "in_progress";
    case PrismaServiceRequestStatus.RESOLVED:
      return "resolved";
    case PrismaServiceRequestStatus.CLOSED:
      return "closed";
  }
}
