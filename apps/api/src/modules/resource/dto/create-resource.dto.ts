import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import type {
  ResourceStatus,
  ResourceType
} from "@campusbook/shared-types";

export class CreateResourceDto {
  @IsIn(["academic_space", "sports_facility"])
  type!: ResourceType;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

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
