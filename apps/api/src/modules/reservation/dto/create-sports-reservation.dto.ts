import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
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

  @IsOptional()
  @IsEmail()
  userEmail?: string;
}
