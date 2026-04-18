import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AdminRulesController } from "./rules.controller";
import { RulesService } from "./rules.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminRulesController],
  providers: [RulesService],
  exports: [RulesService]
})
export class RulesModule {}
