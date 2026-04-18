import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min
} from "class-validator";
import type { ActivityStatus } from "@campusbook/shared-types";

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuota?: number;

  @IsOptional()
  @IsDateString()
  saleStartTime?: string;

  @IsOptional()
  @IsDateString()
  saleEndTime?: string;

  @IsOptional()
  @IsDateString()
  eventStartTime?: string;

  @IsOptional()
  @IsDateString()
  eventEndTime?: string;

  @IsOptional()
  @IsIn(["draft", "published", "closed", "cancelled"])
  status?: ActivityStatus;
}
