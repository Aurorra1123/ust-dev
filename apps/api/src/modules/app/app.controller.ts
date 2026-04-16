import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      service: "campusbook-api",
      stage: "foundation",
      message: "CampusBook API skeleton is running"
    };
  }
}
