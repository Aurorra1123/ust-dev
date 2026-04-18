import { plainToInstance } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync
} from "class-validator";

class EnvironmentVariables {
  @IsOptional()
  @IsIn(["development", "test", "production"])
  NODE_ENV?: "development" | "test" | "production";

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  DEMO_USER_EMAIL!: string;

  @IsString()
  @IsNotEmpty()
  DEMO_USER_PASSWORD!: string;

  @IsIn(["student", "admin"])
  DEMO_USER_ROLE!: "student" | "admin";

  @IsString()
  @IsNotEmpty()
  DEMO_ADMIN_EMAIL!: string;

  @IsString()
  @IsNotEmpty()
  DEMO_ADMIN_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  INTERNAL_JOB_TOKEN!: string;

  @IsString()
  @IsNotEmpty()
  ALLOWED_ORIGINS!: string;

  @IsNumber()
  API_PORT!: number;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false
  });

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.toString()).join("\n"));
  }

  return validatedConfig;
}
