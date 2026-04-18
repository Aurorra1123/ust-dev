import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type {
  ActivityDetailResponse,
  ActivityListItem
} from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ActivitiesService } from "./activities.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { CreateActivityTicketDto } from "./dto/create-activity-ticket.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";

@Controller("activities")
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  listActivities(): Promise<ActivityListItem[]> {
    return this.activitiesService.listActivities();
  }

  @Get(":id")
  getActivity(@Param("id") id: string): Promise<ActivityDetailResponse> {
    return this.activitiesService.getActivityDetail(id);
  }
}

@Controller("admin/activities")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  createActivity(
    @Body() payload: CreateActivityDto
  ): Promise<ActivityDetailResponse> {
    return this.activitiesService.createActivity(payload);
  }

  @Patch(":id")
  updateActivity(
    @Param("id") id: string,
    @Body() payload: UpdateActivityDto
  ): Promise<ActivityDetailResponse> {
    return this.activitiesService.updateActivity(id, payload);
  }

  @Post(":id/tickets")
  createTicket(
    @Param("id") id: string,
    @Body() payload: CreateActivityTicketDto
  ): Promise<ActivityDetailResponse> {
    return this.activitiesService.createActivityTicket(id, payload);
  }
}
