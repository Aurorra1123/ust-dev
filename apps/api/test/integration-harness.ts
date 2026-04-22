import { execFileSync } from "node:child_process";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  ActivityStatus,
  ActivityTicketStatus,
  Prisma,
  PrismaClient,
  UserRole,
  UserStatus
} from "@prisma/client";
import { Queue } from "bullmq";
import cookieParser from "cookie-parser";
import Redis from "ioredis";

import { createBullmqConnection } from "../src/infrastructure/redis/bullmq";
import { ACTIVITY_REGISTRATION_QUEUE_NAME } from "../src/modules/activities/activity-registration.constants";

const TEST_DATABASE_URL =
  process.env.GUARDRAIL_DATABASE_URL ??
  "postgresql://campusbook:campusbook@127.0.0.1:5432/campusbook?schema=guardrail_test";
const TEST_REDIS_URL =
  process.env.GUARDRAIL_REDIS_URL ?? "redis://127.0.0.1:6379/15";
const TEST_INTERNAL_JOB_TOKEN =
  process.env.GUARDRAIL_INTERNAL_JOB_TOKEN ?? "guardrail-internal-job-token";
const TEST_ACCESS_SECRET =
  process.env.GUARDRAIL_JWT_ACCESS_SECRET ?? "guardrail-access-secret";
const TEST_REFRESH_SECRET =
  process.env.GUARDRAIL_JWT_REFRESH_SECRET ?? "guardrail-refresh-secret";
const TEST_ALLOWED_ORIGINS =
  process.env.GUARDRAIL_ALLOWED_ORIGINS ?? "http://127.0.0.1";
const TEST_DEMO_USER_EMAIL =
  process.env.GUARDRAIL_DEMO_USER_EMAIL ?? "demo@campusbook.top";
const TEST_DEMO_USER_PASSWORD =
  process.env.GUARDRAIL_DEMO_USER_PASSWORD ?? "demo123456";
const TEST_DEMO_ADMIN_EMAIL =
  process.env.GUARDRAIL_DEMO_ADMIN_EMAIL ?? "admin@campusbook.top";
const TEST_DEMO_ADMIN_PASSWORD =
  process.env.GUARDRAIL_DEMO_ADMIN_PASSWORD ?? "admin123456";

export interface TestResponse<T = unknown> {
  status: number;
  payload: T | null;
  headers: Headers;
}

export interface IntegrationHarness {
  baseUrl: string;
  prisma: PrismaClient;
  resetFixture(): Promise<void>;
  close(): Promise<void>;
  request<T = unknown>(path: string, options?: RequestOptions): Promise<TestResponse<T>>;
  login(email: string, password?: string): Promise<string>;
  loginDemoStudent(): Promise<string>;
  loginDemoAdmin(): Promise<string>;
  createStudentUsers(prefix: string, count: number): Promise<string[]>;
  createPublishedActivityWithTicket(params: {
    title: string;
    stock: number;
    priceCents?: number;
  }): Promise<{
    activityId: string;
    ticketId: string;
  }>;
  runExpirePendingOrders(): Promise<TestResponse>;
  waitForActivityQueueIdle(timeoutMs?: number): Promise<void>;
}

interface RequestOptions {
  method?: string;
  accessToken?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function createIntegrationHarness(): Promise<IntegrationHarness> {
  applyTestEnvironment();
  runApiCommand(["prisma:migrate:deploy"]);
  const [{ AppModule }, { WorkerModule }] = await Promise.all([
    import("../src/app.module"),
    import("../src/worker.module")
  ]);

  const prisma = new PrismaClient();
  const activityQueue = new Queue(ACTIVITY_REGISTRATION_QUEUE_NAME, {
    connection: createBullmqConnection(TEST_REDIS_URL)
  });

  const workerApp = await NestFactory.createApplicationContext(WorkerModule, {
    logger: false
  });
  const apiApp = await createApiApplication(AppModule);
  const baseUrl = await listenOnRandomPort(apiApp);

  async function waitForActivityQueueIdle(timeoutMs = 10_000) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const counts = await activityQueue.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "prioritized"
      );

      const pendingJobs =
        (counts.waiting ?? 0) +
        (counts.active ?? 0) +
        (counts.delayed ?? 0) +
        (counts.prioritized ?? 0);

      if (pendingJobs === 0) {
        return;
      }

      await delay(100);
    }

    throw new Error("activity-registration-queue-did-not-drain");
  }

  async function resetFixture() {
    await waitForActivityQueueIdle();
    await prisma.$executeRawUnsafe(
      `SELECT set_config('search_path', current_schema(), false)`
    );
    await prisma.$executeRawUnsafe("SELECT pg_advisory_lock(90422026)");

    try {
      await flushCurrentRedisDb(prisma);
      await truncateCurrentSchema(prisma);
      runApiCommand(["seed:demo"]);
    } finally {
      await prisma.$executeRawUnsafe("SELECT pg_advisory_unlock(90422026)");
    }
  }

  async function request<T = unknown>(
    path: string,
    options: RequestOptions = {}
  ): Promise<TestResponse<T>> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.headers ?? {}),
        ...(options.accessToken
          ? {
              Authorization: `Bearer ${options.accessToken}`
            }
          : {}),
        ...(options.body !== undefined
          ? {
              "Content-Type": "application/json"
            }
          : {})
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload =
      response.status === 204
        ? null
        : contentType.includes("application/json")
          ? ((await response.json()) as T)
          : ((await response.text()) as T);

    return {
      status: response.status,
      payload,
      headers: response.headers
    };
  }

  async function login(email: string, password = TEST_DEMO_USER_PASSWORD) {
    const response = await request<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: {
        email,
        password
      }
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(
        `login-failed:${email}:${response.status}:${JSON.stringify(response.payload)}`
      );
    }

    if (!response.payload?.accessToken) {
      throw new Error(`login-missing-access-token:${email}`);
    }

    return response.payload.accessToken;
  }

  async function createStudentUsers(prefix: string, count: number) {
    const emails = Array.from({ length: count }, (_, index) =>
      `${prefix}-${index + 1}@campusbook.top`
    );

    await prisma.user.createMany({
      data: emails.map((email, index) => ({
        id: `${prefix.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${index + 1}`,
        email,
        name: email.split("@")[0] ?? `student-${index + 1}`,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        creditScore: 100
      }))
    });

    return emails;
  }

  async function createPublishedActivityWithTicket(params: {
    title: string;
    stock: number;
    priceCents?: number;
  }) {
    const now = new Date();
    const activity = await prisma.activity.create({
      data: {
        title: params.title,
        description: `${params.title} integration fixture`,
        location: "Integration Hall",
        totalQuota: params.stock,
        saleStartTime: new Date(now.getTime() - 60 * 60 * 1000),
        saleEndTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        eventStartTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        eventEndTime: new Date(now.getTime() + 50 * 60 * 60 * 1000),
        status: ActivityStatus.PUBLISHED,
        tickets: {
          create: {
            name: `${params.title} Ticket`,
            stock: params.stock,
            priceCents: params.priceCents ?? 0,
            status: ActivityTicketStatus.ACTIVE
          }
        }
      },
      include: {
        tickets: true
      }
    });

    return {
      activityId: activity.id,
      ticketId: activity.tickets[0]!.id
    };
  }

  await resetFixture();

  return {
    baseUrl,
    prisma,
    resetFixture,
    request,
    login,
    loginDemoStudent: () => login(TEST_DEMO_USER_EMAIL, TEST_DEMO_USER_PASSWORD),
    loginDemoAdmin: () => login(TEST_DEMO_ADMIN_EMAIL, TEST_DEMO_ADMIN_PASSWORD),
    createStudentUsers,
    createPublishedActivityWithTicket,
    runExpirePendingOrders: () =>
      request("/orders/jobs/expire-pending", {
        method: "POST",
        headers: {
          "x-internal-job-token": TEST_INTERNAL_JOB_TOKEN
        }
      }),
    waitForActivityQueueIdle,
    async close() {
      await waitForActivityQueueIdle().catch(() => undefined);
      await apiApp.close();
      await workerApp.close();
      await activityQueue.close();
      await prisma.$disconnect();
    }
  };
}

async function createApiApplication(module: object) {
  const app = await NestFactory.create(module, {
    logger: false
  });

  app.enableCors({
    origin: true,
    credentials: true
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  return app;
}

async function listenOnRandomPort(app: INestApplication) {
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

function applyTestEnvironment() {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.REDIS_URL = TEST_REDIS_URL;
  process.env.JWT_ACCESS_SECRET = TEST_ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = TEST_REFRESH_SECRET;
  process.env.ORDER_PENDING_EXPIRE_SECONDS = "120";
  process.env.DEMO_USER_EMAIL = TEST_DEMO_USER_EMAIL;
  process.env.DEMO_USER_PASSWORD = TEST_DEMO_USER_PASSWORD;
  process.env.DEMO_USER_ROLE = "student";
  process.env.DEMO_ADMIN_EMAIL = TEST_DEMO_ADMIN_EMAIL;
  process.env.DEMO_ADMIN_PASSWORD = TEST_DEMO_ADMIN_PASSWORD;
  process.env.INTERNAL_JOB_TOKEN = TEST_INTERNAL_JOB_TOKEN;
  process.env.ALLOWED_ORIGINS = TEST_ALLOWED_ORIGINS;
  process.env.API_PORT = "0";
}

function runApiCommand(args: string[]) {
  execFileSync("pnpm", ["--filter", "api", ...args], {
    cwd: resolveRepoRoot(),
    stdio: "pipe",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      REDIS_URL: TEST_REDIS_URL,
      JWT_ACCESS_SECRET: TEST_ACCESS_SECRET,
      JWT_REFRESH_SECRET: TEST_REFRESH_SECRET,
      ORDER_PENDING_EXPIRE_SECONDS: "120",
      DEMO_USER_EMAIL: TEST_DEMO_USER_EMAIL,
      DEMO_USER_PASSWORD: TEST_DEMO_USER_PASSWORD,
      DEMO_USER_ROLE: "student",
      DEMO_ADMIN_EMAIL: TEST_DEMO_ADMIN_EMAIL,
      DEMO_ADMIN_PASSWORD: TEST_DEMO_ADMIN_PASSWORD,
      INTERNAL_JOB_TOKEN: TEST_INTERNAL_JOB_TOKEN,
      ALLOWED_ORIGINS: TEST_ALLOWED_ORIGINS,
      API_PORT: "0",
      NODE_ENV: "test"
    }
  });
}

async function flushCurrentRedisDb(prisma: PrismaClient) {
  await prisma.$queryRaw`SELECT 1`;

  const redis = new Redis(TEST_REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false
  });

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    await redis.flushdb();
  } finally {
    if (redis.status === "ready" || redis.status === "connect") {
      await redis.quit();
    } else {
      redis.disconnect(false);
    }
  }
}

async function truncateCurrentSchema(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>(Prisma.sql`
    SELECT "tablename"
    FROM "pg_tables"
    WHERE "schemaname" = current_schema()
      AND "tablename" <> '_prisma_migrations'
    ORDER BY "tablename" ASC
  `);

  if (tables.length === 0) {
    return;
  }

  const tableNames = tables
    .map((table) => `"${table.tablename.replace(/"/g, "\"\"")}"`)
    .join(", ");

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`
  );
}

function resolveRepoRoot() {
  return resolve(__dirname, "../..");
}
