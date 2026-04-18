import { IsIn, IsOptional } from "class-validator";
import type { ResourceType } from "@campusbook/shared-types";

export class ListResourcesQueryDto {
  @IsOptional()
  @IsIn(["academic_space", "sports_facility"])
  type?: ResourceType;
}
