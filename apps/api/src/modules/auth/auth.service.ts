import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthSessionResponse, UserRole } from "@campusbook/shared-types";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_COOKIE_NAME = "campusbook_refresh_token";

interface SessionUser {
  email: string;
  role: UserRole;
}

interface TokenPayload extends SessionUser {
  sub: string;
  tokenType: "access" | "refresh";
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(email: string, password: string) {
    const demoEmail = this.configService.getOrThrow<string>("DEMO_USER_EMAIL");
    const demoPassword =
      this.configService.getOrThrow<string>("DEMO_USER_PASSWORD");

    if (email !== demoEmail || password !== demoPassword) {
      throw new UnauthorizedException("invalid-credentials");
    }

    const user = this.getDemoUser();
    return this.createSession(user);
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("missing-refresh-token");
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    return this.createSession({
      email: payload.email,
      role: payload.role
    });
  }

  getRefreshCookieOptions() {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: false,
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

  private async createSession(user: SessionUser): Promise<{
    response: AuthSessionResponse;
    refreshToken: string;
  }> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.email,
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
        sub: user.email,
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

  private getDemoUser(): SessionUser {
    return {
      email: this.configService.getOrThrow<string>("DEMO_USER_EMAIL"),
      role: this.configService.getOrThrow<UserRole>("DEMO_USER_ROLE")
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET")
        }
      );

      if (payload.tokenType !== "refresh") {
        throw new UnauthorizedException("invalid-refresh-token");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("invalid-refresh-token");
    }
  }
}
