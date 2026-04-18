import { IsIn, IsOptional, IsString } from "class-validator";
import type {
  ResourceStatus,
  ResourceType
} from "@campusbook/shared-types";

export class UpdateResourceDto {
  @IsOptional()
  @IsIn(["academic_space", "sports_facility"])
  type?: ResourceType;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: ResourceStatus;
}
