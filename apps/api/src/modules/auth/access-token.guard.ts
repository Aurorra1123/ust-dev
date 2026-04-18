import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { Request } from "express";

import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.types";

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("missing-access-token");
    }

    const accessToken = authHeader.slice("Bearer ".length).trim();

    if (!accessToken) {
      throw new UnauthorizedException("missing-access-token");
    }

    request.user = await this.authService.verifyAccessToken(accessToken);
    return true;
  }
}
