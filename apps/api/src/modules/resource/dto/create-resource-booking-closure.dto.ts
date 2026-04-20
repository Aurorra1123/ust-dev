import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString
} from "class-validator";

export class CreateResourceBookingClosureDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  resourceIds!: string[];

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
