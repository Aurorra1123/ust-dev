import { Injectable } from "@nestjs/common";
import { ActivityTicketStatus } from "@prisma/client";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ActivityInventoryCacheService } from "./activity-inventory-cache.service";

const DEFAULT_REHYDRATE_LIMIT = 200;

@Injectable()
export class ActivityInventoryRecoveryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityInventoryCacheService: ActivityInventoryCacheService
  ) {}

  async rehydrateActiveTickets(limit = DEFAULT_REHYDRATE_LIMIT) {
    const tickets = await this.prismaService.activityTicket.findMany({
      where: {
        status: ActivityTicketStatus.ACTIVE
      },
      select: {
        id: true,
        activityId: true,
        stock: true,
        reserved: true
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: limit
    });

    for (const ticket of tickets) {
      await this.activityInventoryCacheService.reconcileTicketRemaining(
        ticket.activityId,
        ticket.id,
        Math.max(ticket.stock - ticket.reserved, 0)
      );
    }

    return tickets.length;
  }
}
