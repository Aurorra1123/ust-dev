import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import type {
  AcademicReservationResponse,
  AppRule,
  MockPaymentStartResponse,
  OrderDetailResponse
} from "@campusbook/shared-types";

import { OrderExpirationQueueService } from "../src/modules/orders/order-expiration-queue.service";
import {
  createIntegrationHarness,
  type IntegrationHarness
} from "./integration-harness";

describe("COMP-005 business regressions", { concurrency: 1 }, () => {
  let harness: IntegrationHarness;

  before(async () => {
    harness = await createIntegrationHarness({
      initializeFixture: false
    });
  });

  beforeEach(async () => {
    await harness.resetFixture();
  });

  after(async () => {
    await harness.close();
  });

  test("delayed expiration worker 会自动取消待支付订单", async () => {
    const setup = await createPendingPaidOrder(harness);
    const expirationQueue =
      harness.getApiService<OrderExpirationQueueService>(OrderExpirationQueueService);
    const expireAt = new Date(Date.now() + 1_000);

    await harness.prisma.order.update({
      where: {
        id: setup.orderId
      },
      data: {
        expireAt
      }
    });
    await expirationQueue.scheduleExpiration(setup.orderId, expireAt);

    const cancelledOrder = await waitForOrderStatus(harness, setup.orderId, setup.accessToken, "cancelled");

    assert.equal(cancelledOrder.paymentRecords.at(-1)?.payStatus, "failed");
  });

  test("同用户跨票种不能形成同活动双报名", async () => {
    const studentToken = await harness.loginDemoStudent();
    const now = new Date();
    const activity = await harness.prisma.activity.create({
      data: {
        title: "COMP-005 duplicate activity guard",
        description: "duplicate activity guard",
        location: "Smoke Hall",
        totalQuota: 2,
        saleStartTime: new Date(now.getTime() - 60 * 60 * 1000),
        saleEndTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        eventStartTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        eventEndTime: new Date(now.getTime() + 49 * 60 * 60 * 1000),
        status: "PUBLISHED",
        tickets: {
          create: [
            {
              name: "General",
              stock: 1,
              priceCents: 0,
              status: "ACTIVE"
            },
            {
              name: "Priority",
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
            createdAt: "asc"
          }
        }
      }
    });

    const firstGrab = await harness.request(`/activities/${activity.id}/grab`, {
      method: "POST",
      accessToken: studentToken,
      body: {
        ticketId: activity.tickets[0]!.id
      }
    });

    assert.equal(firstGrab.status, 201);
    await harness.waitForRegistrationStatus(
      activity.id,
      studentToken,
      "confirmed"
    );

    const secondGrab = await harness.request(`/activities/${activity.id}/grab`, {
      method: "POST",
      accessToken: studentToken,
      body: {
        ticketId: activity.tickets[1]!.id
      }
    });

    assert.equal(secondGrab.status, 409);
  });

  test("规则停用后立即失效、启用后立即生效", async () => {
    const adminToken = await harness.loginDemoAdmin();
    const studentToken = await harness.loginDemoStudent();
    const academicResource = await harness.prisma.resourceUnit.findUniqueOrThrow({
      where: {
        id: "unit_academic_demo"
      },
      select: {
        resourceId: true
      }
    });

    const createRuleResponse = await harness.request<AppRule>("/admin/rules", {
      method: "POST",
      accessToken: adminToken,
      body: {
        name: "COMP-005 dynamic academic credit gate",
        ruleType: "min_credit_score",
        expression: {
          min: 101
        },
        status: "active"
      }
    });

    assert.equal(createRuleResponse.status, 201);
    assert.ok(createRuleResponse.payload);

    const bindResponse = await harness.request<AppRule>(
      `/admin/rules/${createRuleResponse.payload.id}/bindings/resources/${academicResource.resourceId}`,
      {
        method: "POST",
        accessToken: adminToken
      }
    );

    assert.equal(bindResponse.status, 201);

    const blockedReservation = await harness.request("/reservations/academic", {
      method: "POST",
      accessToken: studentToken,
      body: {
        resourceUnitId: "unit_academic_demo",
        startTime: "2030-06-12T10:00:00.000Z",
        endTime: "2030-06-12T11:00:00.000Z"
      }
    });

    assert.equal(blockedReservation.status, 403);

    const inactiveRule = await harness.request<AppRule>(
      `/admin/rules/${createRuleResponse.payload.id}`,
      {
        method: "PATCH",
        accessToken: adminToken,
        body: {
          status: "inactive"
        }
      }
    );

    assert.equal(inactiveRule.status, 200);

    const allowedReservation =
      await harness.request<AcademicReservationResponse>("/reservations/academic", {
        method: "POST",
        accessToken: studentToken,
        body: {
          resourceUnitId: "unit_academic_demo",
          startTime: "2030-06-12T13:00:00.000Z",
          endTime: "2030-06-12T14:00:00.000Z"
        }
      });

    assert.equal(allowedReservation.status, 201);

    const reactivatedRule = await harness.request<AppRule>(
      `/admin/rules/${createRuleResponse.payload.id}`,
      {
        method: "PATCH",
        accessToken: adminToken,
        body: {
          status: "active"
        }
      }
    );

    assert.equal(reactivatedRule.status, 200);

    const blockedAgain = await harness.request("/reservations/academic", {
      method: "POST",
      accessToken: studentToken,
      body: {
        resourceUnitId: "unit_academic_demo",
        startTime: "2030-06-12T16:00:00.000Z",
        endTime: "2030-06-12T17:00:00.000Z"
      }
    });

    assert.equal(blockedAgain.status, 403);
  });
});

async function createPendingPaidOrder(harness: IntegrationHarness) {
  const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
    title: "COMP-005 delayed expiration fixture",
    stock: 1,
    priceCents: 500
  });
  const accessToken = await harness.loginDemoStudent();

  const grabResponse = await harness.request(`/activities/${activityId}/grab`, {
    method: "POST",
    accessToken,
    body: {
      ticketId
    }
  });

  assert.equal(grabResponse.status, 201);
  const registrationStatus = await harness.waitForRegistrationStatus(
    activityId,
    accessToken,
    "pending_confirmation"
  );
  assert.ok(registrationStatus.orderId);

  const mockPayment = await harness.request<MockPaymentStartResponse>(
    `/payments/orders/${registrationStatus.orderId}/mock`,
    {
      method: "POST",
      accessToken
    }
  );

  assert.equal(mockPayment.status, 201);
  assert.ok(mockPayment.payload?.transactionNo);

  return {
    accessToken,
    orderId: registrationStatus.orderId
  };
}

async function waitForOrderStatus(
  harness: IntegrationHarness,
  orderId: string,
  accessToken: string,
  targetStatus: OrderDetailResponse["status"],
  timeoutMs = 8_000
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const order = await harness.request<OrderDetailResponse>(`/orders/${orderId}`, {
      accessToken
    });

    if (order.payload?.status === targetStatus) {
      return order.payload;
    }

    await delay(200);
  }

  throw new Error(`order-status-timeout:${orderId}:${targetStatus}`);
}
