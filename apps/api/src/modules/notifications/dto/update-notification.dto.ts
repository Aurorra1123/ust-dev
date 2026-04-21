import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
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
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsIn(["draft", "published"])
  status?: NotificationStatus;
}
