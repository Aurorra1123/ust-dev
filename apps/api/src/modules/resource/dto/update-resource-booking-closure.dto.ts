import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString
} from "class-validator";

export class UpdateResourceBookingClosureDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
