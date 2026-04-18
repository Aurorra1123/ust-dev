import { IsNotEmpty, IsString } from "class-validator";

export class ActivityGrabDto {
  @IsString()
  @IsNotEmpty()
  ticketId!: string;
}
