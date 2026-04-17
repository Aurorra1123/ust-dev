import { IsDateString, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateAcademicReservationDto {
  @IsString()
  resourceUnitId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsEmail()
  userEmail?: string;
}
