import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from "@nestjs/common";
import type {
  ReservationCategory,
  RuleExpression,
  RuleType,
  UserRole
} from "@campusbook/shared-types";
import { type Prisma } from "@prisma/client";

export type RuleEvaluationScope = "reservation" | "activity_registration";

export interface RuleEvaluationContext {
  scope: RuleEvaluationScope;
  userId: string;
  userRole: UserRole;
  creditScore: number;
  requestedDurationMinutes: number;
  activeReservationCount: number;
}

export interface NormalizedRuleDefinition {
  id: string;
  name: string;
  ruleType: RuleType;
  expression: RuleExpression;
}

export interface RuleNoShowContext {
  tx: Prisma.TransactionClient;
  userId: string;
  orderId: string;
  reservationCategory: ReservationCategory;
  occurredAt: Date;
}

interface RuleHandler {
  readonly ruleType: RuleType;
  readonly evaluationScopes: RuleEvaluationScope[];
  normalizeExpression(expression: Prisma.JsonValue | null): RuleExpression;
  assert?(
    rule: NormalizedRuleDefinition,
    context: RuleEvaluationContext
  ): void | Promise<void>;
  applyNoShow?(
    rule: NormalizedRuleDefinition,
    context: RuleNoShowContext
  ): Promise<void>;
}

const RULE_HANDLERS: RuleHandler[] = [
  {
    ruleType: "min_credit_score",
    evaluationScopes: ["reservation", "activity_registration"],
    normalizeExpression(expression) {
      const json = ensureJsonObject(expression);
      const min = json.min;

      if (typeof min !== "number" || !Number.isFinite(min) || min < 0) {
        throw new BadRequestException("invalid-rule-expression:min-credit-score");
      }

      return { min };
    },
    assert(rule, context) {
      const min = rule.expression.min!;

      if (context.creditScore < min) {
        throw new ForbiddenException("rule-min-credit-score-not-met");
      }
    }
  },
  {
    ruleType: "max_duration_minutes",
    evaluationScopes: ["reservation"],
    normalizeExpression(expression) {
      const json = ensureJsonObject(expression);
      const max = json.max;

      if (typeof max !== "number" || !Number.isFinite(max) || max <= 0) {
        throw new BadRequestException("invalid-rule-expression:max-duration");
      }

      return { max };
    },
    assert(rule, context) {
      const max = rule.expression.max!;

      if (context.requestedDurationMinutes > max) {
        throw new BadRequestException("rule-max-duration-exceeded");
      }
    }
  },
  {
    ruleType: "allowed_user_roles",
    evaluationScopes: ["reservation", "activity_registration"],
    normalizeExpression(expression) {
      const json = ensureJsonObject(expression);
      const roles = json.roles;

      if (!Array.isArray(roles) || roles.length === 0) {
        throw new BadRequestException("invalid-rule-expression:allowed-roles");
      }

      return {
        roles: roles.map((value) => {
          if (value === "student" || value === "admin") {
            return value;
          }

          throw new BadRequestException("invalid-rule-expression:allowed-roles");
        })
      };
    },
    assert(rule, context) {
      const roles = rule.expression.roles!;

      if (!roles.includes(context.userRole)) {
        throw new ForbiddenException("rule-user-role-not-allowed");
      }
    }
  },
  {
    ruleType: "max_active_reservations_per_category",
    evaluationScopes: ["reservation"],
    normalizeExpression(expression) {
      const json = ensureJsonObject(expression);
      const max = json.max;

      if (typeof max !== "number" || !Number.isFinite(max) || max <= 0) {
        throw new BadRequestException(
          "invalid-rule-expression:max-active-reservations"
        );
      }

      return { max };
    },
    assert(rule, context) {
      const max = rule.expression.max!;

      if (context.activeReservationCount >= max) {
        throw new BadRequestException("rule-max-active-reservations-exceeded");
      }
    }
  },
  {
    ruleType: "no_show_credit_penalty",
    evaluationScopes: [],
    normalizeExpression(expression) {
      const json = ensureJsonObject(expression);
      const scoreDelta = json.scoreDelta;
      const banDays = json.banDays;

      if (
        typeof scoreDelta !== "number" ||
        !Number.isFinite(scoreDelta) ||
        scoreDelta <= 0
      ) {
        throw new BadRequestException("invalid-rule-expression:no-show-penalty");
      }

      if (
        banDays !== undefined &&
        (typeof banDays !== "number" || !Number.isFinite(banDays) || banDays < 0)
      ) {
        throw new BadRequestException("invalid-rule-expression:no-show-ban-days");
      }

      return {
        scoreDelta,
        banDays
      };
    },
    async applyNoShow(rule, context) {
      const scoreDelta = rule.expression.scoreDelta!;
      const banDays = rule.expression.banDays ?? 0;
      const user = await context.tx.user.findUnique({
        where: {
          id: context.userId
        },
        select: {
          creditScore: true
        }
      });

      if (!user) {
        throw new NotFoundException("user-not-found");
      }

      const nextCreditScore = Math.max(user.creditScore - scoreDelta, 0);
      const profileValue = {
        lastPenaltyAt: context.occurredAt.toISOString(),
        lastOrderId: context.orderId,
        lastScoreDelta: -scoreDelta,
        reservationCategory: context.reservationCategory,
        creditScoreAfter: nextCreditScore
      } satisfies Prisma.InputJsonValue;

      await context.tx.user.update({
        where: {
          id: context.userId
        },
        data: {
          creditScore: nextCreditScore
        }
      });

      await context.tx.userCreditLog.create({
        data: {
          userId: context.userId,
          scoreDelta: -scoreDelta,
          reason: `rule-no-show-credit-penalty:${rule.id}:${context.orderId}`
        }
      });

      await context.tx.userRuleProfile.upsert({
        where: {
          userId_ruleId: {
            userId: context.userId,
            ruleId: rule.id
          }
        },
        update: {
          profileValue
        },
        create: {
          userId: context.userId,
          ruleId: rule.id,
          profileValue
        }
      });

      const existingRestriction =
        await context.tx.userReservationRestriction.findUnique({
          where: {
            userId_category: {
              userId: context.userId,
              category: mapSharedCategoryToPrisma(context.reservationCategory)
            }
          }
        });

      const nextBannedUntil =
        banDays > 0
          ? maxDate(
              existingRestriction?.bannedUntil ?? null,
              addDays(context.occurredAt, banDays)
            )
          : existingRestriction?.bannedUntil ?? null;

      if (existingRestriction) {
        await context.tx.userReservationRestriction.update({
          where: {
            userId_category: {
              userId: context.userId,
              category: existingRestriction.category
            }
          },
          data: {
            violationCount: {
              increment: 1
            },
            lastViolatedAt: context.occurredAt,
            bannedUntil: nextBannedUntil
          }
        });

        return;
      }

      await context.tx.userReservationRestriction.create({
        data: {
          userId: context.userId,
          category: mapSharedCategoryToPrisma(context.reservationCategory),
          violationCount: 1,
          lastViolatedAt: context.occurredAt,
          bannedUntil: nextBannedUntil
        }
      });
    }
  }
];

const RULE_HANDLER_REGISTRY = new Map(
  RULE_HANDLERS.map((handler) => [handler.ruleType, handler])
);

export function normalizeRuleDefinition(rule: {
  id: string;
  name: string;
  ruleType: string;
  expression: Prisma.JsonValue | null;
}): NormalizedRuleDefinition {
  const handler = getRuleHandler(rule.ruleType);

  return {
    id: rule.id,
    name: rule.name,
    ruleType: handler.ruleType,
    expression: handler.normalizeExpression(rule.expression)
  };
}

export function assertRuleSatisfied(
  rule: NormalizedRuleDefinition,
  context: RuleEvaluationContext
) {
  const handler = getRuleHandler(rule.ruleType);

  if (
    !handler.assert ||
    !handler.evaluationScopes.includes(context.scope)
  ) {
    return;
  }

  return handler.assert(rule, context);
}

export async function applyNoShowRule(
  rule: NormalizedRuleDefinition,
  context: RuleNoShowContext
) {
  const handler = getRuleHandler(rule.ruleType);

  if (!handler.applyNoShow) {
    return false;
  }

  await handler.applyNoShow(rule, context);
  return true;
}

export function supportsRuleEvaluationScope(
  ruleType: string,
  scope: RuleEvaluationScope
) {
  return (
    isSupportedRuleType(ruleType) &&
    getRuleHandler(ruleType).evaluationScopes.includes(scope)
  );
}

function getRuleHandler(ruleType: string) {
  if (!isSupportedRuleType(ruleType)) {
    throw new BadRequestException("unsupported-rule-type");
  }

  return RULE_HANDLER_REGISTRY.get(ruleType)!;
}

function isSupportedRuleType(value: string): value is RuleType {
  return RULE_HANDLER_REGISTRY.has(value as RuleType);
}

function ensureJsonObject(
  value: Prisma.JsonValue | null
): Prisma.JsonObject {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Prisma.JsonObject;
  }

  throw new BadRequestException("invalid-rule-expression");
}

function mapSharedCategoryToPrisma(value: ReservationCategory) {
  return value === "academic_space" ? "ACADEMIC_SPACE" : "SPORTS_FACILITY";
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function maxDate(left: Date | null, right: Date) {
  if (!left) {
    return right;
  }

  return left.getTime() > right.getTime() ? left : right;
}
