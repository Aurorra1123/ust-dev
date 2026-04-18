import { IsDateString, IsString } from "class-validator";

export class CreateAcademicReservationDto {
  @IsString()
  resourceUnitId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;
}
