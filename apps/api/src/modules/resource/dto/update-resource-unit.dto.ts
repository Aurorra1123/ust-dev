import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min
} from "class-validator";
import type { ResourceAvailabilityMode } from "@campusbook/shared-types";

export class UpdateResourceUnitDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  unitType?: string;

  @IsOptional()
  @IsIn(["continuous", "discrete_slot"])
  availabilityMode?: ResourceAvailabilityMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
