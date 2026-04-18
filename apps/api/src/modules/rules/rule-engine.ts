import {
  BadRequestException,
  ForbiddenException
} from "@nestjs/common";
import type {
  RuleExpression,
  RuleType,
  UserRole
} from "@campusbook/shared-types";
import type { Prisma } from "@prisma/client";

export interface RuleEvaluationContext {
  userRole: UserRole;
  creditScore: number;
  requestedDurationMinutes: number;
}

export interface NormalizedRuleDefinition {
  id: string;
  name: string;
  ruleType: RuleType;
  expression: RuleExpression;
}

export function normalizeRuleDefinition(rule: {
  id: string;
  name: string;
  ruleType: string;
  expression: Prisma.JsonValue | null;
}): NormalizedRuleDefinition {
  if (!isSupportedRuleType(rule.ruleType)) {
    throw new BadRequestException("unsupported-rule-type");
  }

  const expression = parseRuleExpression(rule.ruleType, rule.expression);

  return {
    id: rule.id,
    name: rule.name,
    ruleType: rule.ruleType,
    expression
  };
}

export function assertRuleSatisfied(
  rule: NormalizedRuleDefinition,
  context: RuleEvaluationContext
) {
  switch (rule.ruleType) {
    case "min_credit_score": {
      const min = rule.expression.min!;

      if (context.creditScore < min) {
        throw new ForbiddenException("rule-min-credit-score-not-met");
      }

      return;
    }
    case "max_duration_minutes": {
      const max = rule.expression.max!;

      if (context.requestedDurationMinutes > max) {
        throw new BadRequestException("rule-max-duration-exceeded");
      }

      return;
    }
    case "allowed_user_roles": {
      const roles = rule.expression.roles!;

      if (!roles.includes(context.userRole)) {
        throw new ForbiddenException("rule-user-role-not-allowed");
      }

      return;
    }
  }
}

function parseRuleExpression(
  ruleType: RuleType,
  expression: Prisma.JsonValue | null
): RuleExpression {
  if (!isJsonObject(expression)) {
    throw new BadRequestException("invalid-rule-expression");
  }

  switch (ruleType) {
    case "min_credit_score": {
      const min = expression.min;

      if (typeof min !== "number" || !Number.isFinite(min) || min < 0) {
        throw new BadRequestException("invalid-rule-expression:min-credit-score");
      }

      return { min };
    }
    case "max_duration_minutes": {
      const max = expression.max;

      if (typeof max !== "number" || !Number.isFinite(max) || max <= 0) {
        throw new BadRequestException("invalid-rule-expression:max-duration");
      }

      return { max };
    }
    case "allowed_user_roles": {
      const roles = expression.roles;

      if (!Array.isArray(roles) || roles.length === 0) {
        throw new BadRequestException("invalid-rule-expression:allowed-roles");
      }

      const normalizedRoles = roles.map((value) => {
        if (value === "student" || value === "admin") {
          return value;
        }

        throw new BadRequestException("invalid-rule-expression:allowed-roles");
      });

      return {
        roles: normalizedRoles
      };
    }
  }
}

function isSupportedRuleType(value: string): value is RuleType {
  return (
    value === "min_credit_score" ||
    value === "max_duration_minutes" ||
    value === "allowed_user_roles"
  );
}

function isJsonObject(
  value: Prisma.JsonValue | null
): value is Record<string, Prisma.JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
