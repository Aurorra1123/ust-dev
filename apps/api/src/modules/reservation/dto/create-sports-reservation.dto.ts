import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString
} from "class-validator";

export class CreateSportsReservationDto {
  @IsOptional()
  @IsString()
  resourceUnitId?: string;

  @IsOptional()
  @IsString()
  resourceGroupId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsDateString({}, { each: true })
  slotStarts!: string[];
}
