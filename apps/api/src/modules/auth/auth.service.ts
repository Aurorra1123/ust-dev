import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole as PrismaUserRole, UserStatus } from "@prisma/client";
import type {
  AuthSessionResponse,
  AuthUser,
  UserRole as SharedUserRole
} from "@campusbook/shared-types";

import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import type { AuthenticatedUser, TokenPayload } from "./auth.types";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_COOKIE_NAME = "campusbook_refresh_token";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.authenticateDemoUser(normalizedEmail, password);
    return this.createSession(user);
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("missing-refresh-token");
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.getUserFromTokenPayload(payload);
    return this.createSession(user);
  }

  async verifyAccessToken(accessToken: string) {
    const payload = await this.verifyToken(accessToken, "access");
    return this.getUserFromTokenPayload(payload);
  }

  getRefreshCookieOptions() {
    const isProduction =
      this.configService.get<string>("NODE_ENV") === "production";

    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: isProduction,
      path: "/auth",
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000
    };
  }

  getLogoutCookieOptions() {
    return {
      ...this.getRefreshCookieOptions(),
      maxAge: 0
    };
  }

  private async createSession(user: AuthenticatedUser): Promise<{
    response: AuthSessionResponse;
    refreshToken: string;
  }> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tokenType: "access"
      } satisfies TokenPayload,
      {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: ACCESS_TOKEN_TTL_SECONDS
      }
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tokenType: "refresh"
      } satisfies TokenPayload,
      {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: REFRESH_TOKEN_TTL_SECONDS
      }
    );

    return {
      response: {
        accessToken,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        user
      },
      refreshToken
    };
  }

  private async authenticateDemoUser(email: string, password: string) {
    const demoCredentials = [
      {
        email: this.configService
          .getOrThrow<string>("DEMO_USER_EMAIL")
          .trim()
          .toLowerCase(),
        password: this.configService.getOrThrow<string>("DEMO_USER_PASSWORD"),
        role: this.configService.getOrThrow<SharedUserRole>("DEMO_USER_ROLE")
      },
      {
        email: this.configService
          .getOrThrow<string>("DEMO_ADMIN_EMAIL")
          .trim()
          .toLowerCase(),
        password: this.configService.getOrThrow<string>("DEMO_ADMIN_PASSWORD"),
        role: "admin" as const
      }
    ];

    const matchedCredential = demoCredentials.find(
      (credential) =>
        credential.email === email && credential.password === password
    );

    if (!matchedCredential) {
      throw new UnauthorizedException("invalid-credentials");
    }

    return this.ensureDemoUser(
      matchedCredential.email,
      matchedCredential.role
    );
  }

  private async ensureDemoUser(email: string, role: SharedUserRole) {
    const user = await this.prismaService.user.upsert({
      where: { email },
      update: {
        name: inferNameFromEmail(email),
        role: mapSharedRoleToPrismaRole(role),
        status: UserStatus.ACTIVE
      },
      create: {
        email,
        name: inferNameFromEmail(email),
        role: mapSharedRoleToPrismaRole(role),
        status: UserStatus.ACTIVE
      }
    });

    return this.toAuthenticatedUser(user);
  }

  private async getUserFromTokenPayload(payload: TokenPayload) {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("invalid-session-user");
    }

    return this.toAuthenticatedUser(user);
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    role: PrismaUserRole;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: mapPrismaRoleToSharedRole(user.role)
    };
  }

  private async verifyToken(
    token: string,
    tokenType: TokenPayload["tokenType"]
  ) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.getOrThrow<string>(
          tokenType === "access" ? "JWT_ACCESS_SECRET" : "JWT_REFRESH_SECRET"
        )
      });

      if (payload.tokenType !== tokenType) {
        throw new UnauthorizedException(`invalid-${tokenType}-token`);
      }

      return payload;
    } catch {
      throw new UnauthorizedException(`invalid-${tokenType}-token`);
    }
  }

  private async verifyRefreshToken(refreshToken: string) {
    return this.verifyToken(refreshToken, "refresh");
  }
}

function inferNameFromEmail(email: string) {
  return email.split("@")[0] || "student";
}

function mapSharedRoleToPrismaRole(role: SharedUserRole) {
  return role === "admin" ? PrismaUserRole.ADMIN : PrismaUserRole.STUDENT;
}

function mapPrismaRoleToSharedRole(role: PrismaUserRole): AuthUser["role"] {
  return role === PrismaUserRole.ADMIN ? "admin" : "student";
}
