import { IsIn, IsObject, IsOptional, IsString } from "class-validator";
import type { RuleStatus, RuleType } from "@campusbook/shared-types";

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn([
    "min_credit_score",
    "max_duration_minutes",
    "allowed_user_roles",
    "max_active_reservations_per_category",
    "no_show_credit_penalty"
  ])
  ruleType?: RuleType;

  @IsOptional()
  @IsObject()
  expression?: Record<string, unknown>;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: RuleStatus;
}
