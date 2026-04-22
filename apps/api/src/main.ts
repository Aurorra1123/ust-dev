import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { configureApiApplication } from "./bootstrap-api";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  configureApiApplication(app, allowedOrigins);

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to bootstrap API", error);
  process.exit(1);
});
