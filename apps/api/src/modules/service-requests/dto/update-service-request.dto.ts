import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import type { ServiceRequestStatus } from "@campusbook/shared-types";

export class UpdateServiceRequestDto {
  @IsOptional()
  @IsIn(["submitted", "received", "in_progress", "resolved", "closed"])
  status?: ServiceRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
