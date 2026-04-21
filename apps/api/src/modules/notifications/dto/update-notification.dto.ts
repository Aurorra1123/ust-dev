import { IsIn, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from "class-validator";
import type { NotificationStatus } from "@campusbook/shared-types";

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  summary?: string;

  @IsOptional()
  @ValidateIf((_object, value) => typeof value === "string" && value.trim().length > 0)
  @IsString()
  @MaxLength(500)
  @IsUrl({
    require_protocol: true
  })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsIn(["draft", "published"])
  status?: NotificationStatus;
}
