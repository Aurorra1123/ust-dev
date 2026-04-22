import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, beforeEach, describe, test } from "node:test";

import type { ActivityDetailResponse } from "@campusbook/shared-types";

import { RedisService } from "../src/infrastructure/redis/redis.service";
import { ActivityInventoryCacheService } from "../src/modules/activities/activity-inventory-cache.service";
import { ActivityInventoryRecoveryService } from "../src/modules/activities/activity-inventory-recovery.service";
import {
  getActivityTicketRemainingKey
} from "../src/modules/activities/activity-registration.constants";
import {
  type IntegrationHarness,
  createIntegrationHarness
} from "./integration-harness";

describe("COMP-006 activity inventory consistency and recovery", { concurrency: 1 }, () => {
  let harness: IntegrationHarness;

  before(async () => {
    harness = await createIntegrationHarness();
  });

  beforeEach(async () => {
    await harness.resetFixture();
  });

  after(async () => {
    await harness.close();
  });

  test("创建活动时 totalQuota 必须严格等于票种 stock 之和", async () => {
    const accessToken = await harness.loginDemoAdmin();
    const response = await harness.request("/admin/activities", {
      method: "POST",
      accessToken,
      body: buildActivityPayload({
        title: "Quota Mismatch Activity",
        totalQuota: 3,
        tickets: [
          {
            name: "Standard",
            stock: 2,
            priceCents: 0,
            status: "active"
          }
        ]
      })
    });

    assert.equal(response.status, 400);
  });

  test("新增票种后 totalQuota 会自动同步为所有票种 stock 总和，手工改错会被拒绝", async () => {
    const accessToken = await harness.loginDemoAdmin();
    const createResponse = await harness.request<ActivityDetailResponse>(
      "/admin/activities",
      {
        method: "POST",
        accessToken,
        body: buildActivityPayload({
          title: "Quota Sync Activity",
          totalQuota: 2,
          tickets: [
            {
              name: "Standard",
              stock: 2,
              priceCents: 0,
              status: "active"
            }
          ]
        })
      }
    );

    assert.equal(createResponse.status, 201);
    assert.ok(createResponse.payload);

    const createTicketResponse = await harness.request<ActivityDetailResponse>(
      `/admin/activities/${createResponse.payload.id}/tickets`,
      {
        method: "POST",
        accessToken,
        body: {
          name: "VIP",
          stock: 3,
          priceCents: 500,
          status: "active"
        }
      }
    );

    assert.equal(createTicketResponse.status, 201);
    assert.equal(createTicketResponse.payload?.totalQuota, 5);

    const invalidPatchResponse = await harness.request(
      `/admin/activities/${createResponse.payload.id}`,
      {
        method: "PATCH",
        accessToken,
        body: {
          totalQuota: 4
        }
      }
    );

    assert.equal(invalidPatchResponse.status, 400);
  });

  test("库存 key 丢失后会按 DB 剩余量减去活跃 pending 数重建，不会把活跃占位丢掉", async () => {
    const cacheService = harness.getWorkerService<ActivityInventoryCacheService>(
      ActivityInventoryCacheService
    );
    const redisService = harness.getWorkerService<RedisService>(RedisService);
    const redis = await redisService.connect();
    const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
      title: "Inventory Rebuild Activity",
      stock: 2
    });

    await cacheService.ensureTicketRemaining(activityId, ticketId, 2);

    assert.equal(
      await cacheService.reserveTicketForRequest({
        activityId,
        ticketId,
        userId: "student-a",
        jobId: "job-a",
        ttlMs: 5_000
      }),
      "reserved"
    );

    await redis.del(getActivityTicketRemainingKey(ticketId));

    await cacheService.ensureTicketRemaining(activityId, ticketId, 2);

    assert.equal(await redis.get(getActivityTicketRemainingKey(ticketId)), "1");
    assert.equal(
      await cacheService.reserveTicketForRequest({
        activityId,
        ticketId,
        userId: "student-b",
        jobId: "job-b",
        ttlMs: 5_000
      }),
      "reserved"
    );
    assert.equal(
      await cacheService.reserveTicketForRequest({
        activityId,
        ticketId,
        userId: "student-c",
        jobId: "job-c",
        ttlMs: 5_000
      }),
      "sold_out"
    );
  });

  test("无主补偿会被跳过，不能把别的票种库存错误加回去", async () => {
    const cacheService = harness.getWorkerService<ActivityInventoryCacheService>(
      ActivityInventoryCacheService
    );
    const redisService = harness.getWorkerService<RedisService>(RedisService);
    const redis = await redisService.connect();
    const activity = await harness.prisma.activity.create({
      data: {
        title: "Ownership Check Activity",
        description: "ownership-check",
        location: "Integration Hall",
        totalQuota: 2,
        saleStartTime: new Date(Date.now() - 60_000),
        saleEndTime: new Date(Date.now() + 60 * 60 * 1000),
        status: "PUBLISHED",
        tickets: {
          create: [
            {
              name: "A",
              stock: 1,
              priceCents: 0,
              status: "ACTIVE"
            },
            {
              name: "B",
              stock: 1,
              priceCents: 0,
              status: "ACTIVE"
            }
          ]
        }
      },
      include: {
        tickets: {
          orderBy: {
            name: "asc"
          }
        }
      }
    });
    const ticketA = activity.tickets[0]!;
    const ticketB = activity.tickets[1]!;

    await cacheService.ensureTicketRemaining(activity.id, ticketA.id, 1);
    await cacheService.ensureTicketRemaining(activity.id, ticketB.id, 1);

    assert.equal(
      await cacheService.reserveTicketForRequest({
        activityId: activity.id,
        ticketId: ticketA.id,
        userId: "student-a",
        jobId: "job-a",
        ttlMs: 5_000
      }),
      "reserved"
    );

    assert.equal(
      await cacheService.compensatePendingReservation(
        activity.id,
        ticketB.id,
        "student-a",
        "job-a",
        "wrong-ticket"
      ),
      "skipped"
    );

    assert.equal(await redis.get(getActivityTicketRemainingKey(ticketA.id)), "0");
    assert.equal(await redis.get(getActivityTicketRemainingKey(ticketB.id)), "1");
  });

  test("pending 过期后可通过恢复服务自愈回 DB 剩余量", async () => {
    const cacheService = harness.getWorkerService<ActivityInventoryCacheService>(
      ActivityInventoryCacheService
    );
    const recoveryService = harness.getWorkerService<ActivityInventoryRecoveryService>(
      ActivityInventoryRecoveryService
    );
    const redisService = harness.getWorkerService<RedisService>(RedisService);
    const redis = await redisService.connect();
    const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
      title: "Inventory Recovery Activity",
      stock: 1
    });

    await cacheService.ensureTicketRemaining(activityId, ticketId, 1);

    assert.equal(
      await cacheService.reserveTicketForRequest({
        activityId,
        ticketId,
        userId: "student-a",
        jobId: "job-a",
        ttlMs: 50
      }),
      "reserved"
    );

    await delay(80);

    assert.equal(await redis.get(getActivityTicketRemainingKey(ticketId)), "0");

    await recoveryService.rehydrateActiveTickets();

    assert.equal(await redis.get(getActivityTicketRemainingKey(ticketId)), "1");
  });
});

function buildActivityPayload(params: {
  title: string;
  totalQuota: number;
  tickets: Array<{
    name: string;
    stock: number;
    priceCents: number;
    status: "active" | "inactive";
  }>;
}) {
  const now = Date.now();

  return {
    title: params.title,
    description: `${params.title} integration payload`,
    location: "Integration Hall",
    totalQuota: params.totalQuota,
    saleStartTime: new Date(now - 60_000).toISOString(),
    saleEndTime: new Date(now + 60 * 60 * 1000).toISOString(),
    eventStartTime: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    eventEndTime: new Date(now + 3 * 60 * 60 * 1000).toISOString(),
    status: "published",
    tickets: params.tickets
  };
}
