import { NestFactory } from "@nestjs/core";

import { WorkerModule } from "./worker.module";

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule, {
    logger: ["log", "warn", "error"]
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to bootstrap worker", error);
  process.exit(1);
});
