import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { AppRule } from "@campusbook/shared-types";

import { AccessTokenGuard } from "../auth/access-token.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";
import { RulesService } from "./rules.service";

@Controller("admin/rules")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminRulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  listRules(): Promise<AppRule[]> {
    return this.rulesService.listRules();
  }

  @Post()
  createRule(@Body() payload: CreateRuleDto): Promise<AppRule> {
    return this.rulesService.createRule(payload);
  }

  @Patch(":id")
  updateRule(
    @Param("id") id: string,
    @Body() payload: UpdateRuleDto
  ): Promise<AppRule> {
    return this.rulesService.updateRule(id, payload);
  }

  @Post(":id/bindings/resources/:resourceId")
  bindRuleToResource(
    @Param("id") id: string,
    @Param("resourceId") resourceId: string
  ): Promise<AppRule> {
    return this.rulesService.bindRuleToResource(id, resourceId);
  }
}
