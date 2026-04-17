import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res
} from "@nestjs/common";
import type { AuthSessionResponse } from "@campusbook/shared-types";
import type { Request, Response } from "express";

import { LoginDto } from "./dto/login.dto";
import { AuthService, REFRESH_TOKEN_COOKIE_NAME } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionResponse> {
    const session = await this.authService.login(
      loginDto.email,
      loginDto.password
    );

    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      session.refreshToken,
      this.authService.getRefreshCookieOptions()
    );

    return session.response;
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionResponse> {
    const session = await this.authService.refresh(
      request.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
    );

    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      session.refreshToken,
      this.authService.getRefreshCookieOptions()
    );

    return session.response;
  }

  @Post("logout")
  @HttpCode(200)
  logout(
    @Res({ passthrough: true }) response: Response
  ): { success: true } {
    response.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      this.authService.getLogoutCookieOptions()
    );

    return { success: true };
  }
}
