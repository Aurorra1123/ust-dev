import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from "class-validator";
import type { ActivityTicketStatus } from "@campusbook/shared-types";

export class CreateActivityTicketDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(1)
  stock!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: ActivityTicketStatus;
}
