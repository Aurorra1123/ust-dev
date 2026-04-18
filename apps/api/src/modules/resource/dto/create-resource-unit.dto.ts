import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from "class-validator";
import type { ResourceAvailabilityMode } from "@campusbook/shared-types";

export class CreateResourceUnitDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  unitType!: string;

  @IsIn(["continuous", "discrete_slot"])
  availabilityMode!: ResourceAvailabilityMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
