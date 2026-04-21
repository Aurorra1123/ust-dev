import { IsString, MaxLength } from "class-validator";

export class CreateServiceRequestDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MaxLength(160)
  location!: string;
}
