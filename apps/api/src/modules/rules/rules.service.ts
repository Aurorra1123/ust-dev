import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  OrderBizType,
  OrderStatus,
  ReservationCategory as PrismaReservationCategory,
  ResourceType,
  RuleStatus as PrismaRuleStatus,
  UserRole as PrismaUserRole,
  type Prisma
} from "@prisma/client";
import type {
  AppRule,
  RuleStatus,
  UserRole,
  ReservationCategory
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";
import {
  applyNoShowRule,
  assertRuleSatisfied,
  normalizeRuleDefinition,
  supportsRuleEvaluationScope
} from "./rule-engine";

@Injectable()
export class RulesService {
  constructor(private readonly prismaService: PrismaService) {}

  async listRules(): Promise<AppRule[]> {
    const rules = await this.prismaService.rule.findMany({
      include: {
        resourceBindings: {
          orderBy: {
            resourceId: "asc"
          }
        }
      },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }]
    });

    return rules.map(toAppRule);
  }

  async createRule(payload: CreateRuleDto): Promise<AppRule> {
    const normalized = normalizeRuleDefinition({
      id: "__draft__",
      name: payload.name,
      ruleType: payload.ruleType,
      expression: payload.expression as Prisma.JsonValue
    });

    const created = await this.prismaService.rule.create({
      data: {
        name: normalized.name,
        ruleType: normalized.ruleType,
        expression: normalized.expression as Prisma.InputJsonValue,
        status: mapSharedRuleStatus(payload.status ?? "active")
      },
      include: {
        resourceBindings: true
      }
    });

    return toAppRule(created);
  }

  async updateRule(id: string, payload: UpdateRuleDto): Promise<AppRule> {
    const existing = await this.ensureRuleExists(id);
    const normalized = normalizeRuleDefinition({
      id: existing.id,
      name: payload.name ?? existing.name,
      ruleType: payload.ruleType ?? existing.ruleType,
      expression: (payload.expression as Prisma.JsonValue | undefined) ?? existing.expression
    });

    const updated = await this.prismaService.rule.update({
      where: { id },
      data: {
        name: normalized.name,
        ruleType: normalized.ruleType,
        expression: normalized.expression as Prisma.InputJsonValue,
        ...(payload.status ? { status: mapSharedRuleStatus(payload.status) } : {})
      },
      include: {
        resourceBindings: true
      }
    });

    return toAppRule(updated);
  }

  async bindRuleToResource(ruleId: string, resourceId: string): Promise<AppRule> {
    await this.ensureRuleExists(ruleId);
    await this.ensureResourceExists(resourceId);

    await this.prismaService.resourceRuleBinding.upsert({
      where: {
        resourceId_ruleId: {
          resourceId,
          ruleId
        }
      },
      update: {},
      create: {
        ruleId,
        resourceId
      }
    });

    const rule = await this.prismaService.rule.findUnique({
      where: { id: ruleId },
      include: {
        resourceBindings: true
      }
    });

    if (!rule) {
      throw new NotFoundException("rule-not-found");
    }

    return toAppRule(rule);
  }

  async unbindRuleFromResource(ruleId: string, resourceId: string): Promise<AppRule> {
    await this.ensureRuleExists(ruleId);
    await this.ensureResourceExists(resourceId);

    await this.prismaService.resourceRuleBinding.deleteMany({
      where: {
        ruleId,
        resourceId
      }
    });

    const rule = await this.prismaService.rule.findUnique({
      where: { id: ruleId },
      include: {
        resourceBindings: true
      }
    });

    if (!rule) {
      throw new NotFoundException("rule-not-found");
    }

    return toAppRule(rule);
  }

  async deleteRule(id: string): Promise<{ id: string }> {
    const rule = await this.prismaService.rule.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            resourceBindings: true,
            userProfiles: true
          }
        }
      }
    });

    if (!rule) {
      throw new NotFoundException("rule-not-found");
    }

    if (rule._count.resourceBindings > 0 || rule._count.userProfiles > 0) {
      throw new ConflictException("rule-delete-blocked-existing-bindings");
    }

    await this.prismaService.rule.delete({
      where: { id }
    });

    return {
      id
    };
  }

  async assertActivityRules(params: {
    activityId: string;
    userId: string;
  }) {
    const [activity, user, rules] = await Promise.all([
      this.prismaService.activity.findUnique({
        where: {
          id: params.activityId
        },
        select: {
          id: true
        }
      }),
      this.prismaService.user.findUnique({
        where: { id: params.userId },
        select: {
          role: true,
          creditScore: true
        }
      }),
      this.prismaService.rule.findMany({
        where: {
          status: PrismaRuleStatus.ACTIVE
        },
        orderBy: {
          createdAt: "asc"
        }
      })
    ]);

    if (!activity) {
      throw new NotFoundException("activity-not-found");
    }

    if (!user) {
      throw new NotFoundException("user-not-found");
    }

    for (const candidate of rules) {
      if (
        !supportsRuleEvaluationScope(
          candidate.ruleType,
          "activity_registration"
        )
      ) {
        continue;
      }

      const rule = normalizeRuleDefinition({
        id: candidate.id,
        name: candidate.name,
        ruleType: candidate.ruleType,
        expression: candidate.expression
      });

      await assertRuleSatisfied(rule, {
        scope: "activity_registration",
        userId: params.userId,
        userRole: mapPrismaRoleToSharedRole(user.role),
        creditScore: user.creditScore,
        requestedDurationMinutes: 0,
        activeReservationCount: 0
      });
    }
  }

  async assertReservationRules(params: {
    resourceId: string;
    userId: string;
    requestedDurationMinutes: number;
  }) {
    const resource = await this.prismaService.resource.findUnique({
      where: { id: params.resourceId },
      include: {
        ruleBindings: {
          include: {
            rule: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!resource) {
      throw new NotFoundException("resource-not-found");
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: params.userId },
      select: {
        role: true,
        creditScore: true
      }
    });

    if (!user) {
      throw new NotFoundException("user-not-found");
    }

    const activeReservationCount = await this.countActiveReservationOrders(
      params.userId,
      mapResourceTypeToCategory(resource.type)
    );

    for (const binding of resource.ruleBindings) {
      if (binding.rule.status !== PrismaRuleStatus.ACTIVE) {
        continue;
      }

      const rule = normalizeRuleDefinition({
        id: binding.rule.id,
        name: binding.rule.name,
        ruleType: binding.rule.ruleType,
        expression: binding.rule.expression
      });

      await assertRuleSatisfied(rule, {
        scope: "reservation",
        userId: params.userId,
        userRole: mapPrismaRoleToSharedRole(user.role),
        creditScore: user.creditScore,
        requestedDurationMinutes: params.requestedDurationMinutes,
        activeReservationCount
      });
    }
  }

  async applyReservationNoShowRules(params: {
    tx: Prisma.TransactionClient;
    resourceId: string;
    orderId: string;
    participantUserIds: string[];
    reservationCategory: PrismaReservationCategory;
    occurredAt: Date;
  }) {
    const bindings = await params.tx.resourceRuleBinding.findMany({
      where: {
        resourceId: params.resourceId
      },
      include: {
        rule: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    for (const binding of bindings) {
      if (binding.rule.status !== PrismaRuleStatus.ACTIVE) {
        continue;
      }

      const rule = normalizeRuleDefinition({
        id: binding.rule.id,
        name: binding.rule.name,
        ruleType: binding.rule.ruleType,
        expression: binding.rule.expression
      });

      for (const userId of params.participantUserIds) {
        await applyNoShowRule(rule, {
          tx: params.tx,
          userId,
          orderId: params.orderId,
          reservationCategory: mapPrismaCategoryToSharedCategory(
            params.reservationCategory
          ),
          occurredAt: params.occurredAt
        });
      }
    }
  }

  private async ensureRuleExists(id: string) {
    const rule = await this.prismaService.rule.findUnique({
      where: { id }
    });

    if (!rule) {
      throw new NotFoundException("rule-not-found");
    }

    return rule;
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

  private async countActiveReservationOrders(
    userId: string,
    category: PrismaReservationCategory
  ) {
    return this.prismaService.order.count({
      where: {
        userId,
        bizType: OrderBizType.RESOURCE_RESERVATION,
        status: {
          in: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED]
        },
        ...(category === PrismaReservationCategory.ACADEMIC_SPACE
          ? {
              academicReservation: {
                is: {}
              }
            }
          : {
              sportsReservationSlots: {
                some: {}
              }
            })
      }
    });
  }
}

function toAppRule(rule: {
  id: string;
  name: string;
  ruleType: string;
  status: PrismaRuleStatus;
  expression: Prisma.JsonValue | null;
  resourceBindings: Array<{
    resourceId: string;
  }>;
}): AppRule {
  const normalized = normalizeRuleDefinition({
    id: rule.id,
    name: rule.name,
    ruleType: rule.ruleType,
    expression: rule.expression
  });

  return {
    id: normalized.id,
    name: normalized.name,
    ruleType: normalized.ruleType,
    status: mapPrismaRuleStatus(rule.status),
    expression: normalized.expression,
    resourceIds: rule.resourceBindings.map((binding) => binding.resourceId)
  };
}

function mapSharedRuleStatus(value: RuleStatus) {
  return value === "active" ? PrismaRuleStatus.ACTIVE : PrismaRuleStatus.INACTIVE;
}

function mapPrismaRuleStatus(value: PrismaRuleStatus): RuleStatus {
  return value === PrismaRuleStatus.ACTIVE ? "active" : "inactive";
}

function mapPrismaRoleToSharedRole(value: PrismaUserRole): UserRole {
  return value === PrismaUserRole.ADMIN ? "admin" : "student";
}

function mapResourceTypeToCategory(value: ResourceType) {
  return value === ResourceType.ACADEMIC_SPACE
    ? PrismaReservationCategory.ACADEMIC_SPACE
    : PrismaReservationCategory.SPORTS_FACILITY;
}

function mapPrismaCategoryToSharedCategory(
  value: PrismaReservationCategory
): ReservationCategory {
  return value === PrismaReservationCategory.ACADEMIC_SPACE
    ? "academic_space"
    : "sports_facility";
}
