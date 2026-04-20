import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min
} from "class-validator";

export class UpdateResourceReleaseRuleDto {
  @IsOptional()
  @IsIn(["daily", "weekly", "monthly"])
  frequency?: "daily" | "weekly" | "monthly";

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  hour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  minute?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
