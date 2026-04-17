import { IsOptional, IsString, MaxLength } from "class-validator";

export class TransitionOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
