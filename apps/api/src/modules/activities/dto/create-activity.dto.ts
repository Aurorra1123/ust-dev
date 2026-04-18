import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import type { ActivityStatus } from "@campusbook/shared-types";

import { CreateActivityTicketDto } from "./create-activity-ticket.dto";

export class CreateActivityDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsInt()
  @Min(1)
  totalQuota!: number;

  @IsDateString()
  saleStartTime!: string;

  @IsDateString()
  saleEndTime!: string;

  @IsOptional()
  @IsDateString()
  eventStartTime?: string;

  @IsOptional()
  @IsDateString()
  eventEndTime?: string;

  @IsOptional()
  @IsIn(["draft", "published", "closed", "cancelled"])
  status?: ActivityStatus;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateActivityTicketDto)
  tickets?: CreateActivityTicketDto[];
}
