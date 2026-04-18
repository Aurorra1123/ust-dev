import {
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  RuleStatus as PrismaRuleStatus,
  UserRole as PrismaUserRole,
  type Prisma
} from "@prisma/client";
import type {
  AppRule,
  RuleStatus,
  UserRole
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";
import {
  assertRuleSatisfied,
  normalizeRuleDefinition
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
    const created = await this.prismaService.rule.create({
      data: {
        name: payload.name,
        ruleType: payload.ruleType,
        expression: payload.expression as Prisma.InputJsonValue,
        status: mapSharedRuleStatus(payload.status ?? "active")
      },
      include: {
        resourceBindings: true
      }
    });

    return toAppRule(created);
  }

  async updateRule(id: string, payload: UpdateRuleDto): Promise<AppRule> {
    await this.ensureRuleExists(id);

    const updated = await this.prismaService.rule.update({
      where: { id },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.ruleType ? { ruleType: payload.ruleType } : {}),
        ...(payload.expression
          ? { expression: payload.expression as Prisma.InputJsonValue }
          : {}),
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

      assertRuleSatisfied(rule, {
        userRole: mapPrismaRoleToSharedRole(user.role),
        creditScore: user.creditScore,
        requestedDurationMinutes: params.requestedDurationMinutes
      });
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
