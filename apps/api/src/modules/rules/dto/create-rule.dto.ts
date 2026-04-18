import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import type { RuleStatus, RuleType } from "@campusbook/shared-types";

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(["min_credit_score", "max_duration_minutes", "allowed_user_roles"])
  ruleType!: RuleType;

  @IsObject()
  expression!: Record<string, unknown>;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: RuleStatus;
}
