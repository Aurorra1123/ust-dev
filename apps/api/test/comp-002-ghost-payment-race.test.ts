import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";

import type {
  ActivityRegistrationStatusResponse,
  MockPaymentStartResponse,
  OrderDetailResponse
} from "@campusbook/shared-types";
import { PaymentCompensationType, PaymentStatus } from "@prisma/client";

import {
  type IntegrationHarness,
  createIntegrationHarness
} from "./integration-harness";

describe("COMP-002 ghost payment race", { concurrency: 1 }, () => {
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

  test("重复 callback 应保持幂等，不会重复确认订单", async () => {
    const setup = await createPendingPaidOrder(harness);

    const firstCallback = await harness.request<OrderDetailResponse>(
      "/payments/mock/callback",
      {
        method: "POST",
        accessToken: setup.accessToken,
        body: {
          transactionNo: setup.transactionNo
        }
      }
    );

    const secondCallback = await harness.request<OrderDetailResponse>(
      "/payments/mock/callback",
      {
        method: "POST",
        accessToken: setup.accessToken,
        body: {
          transactionNo: setup.transactionNo
        }
      }
    );

    assert.equal(firstCallback.status, 201);
    assert.equal(secondCallback.status, 201);
    assert.equal(secondCallback.payload?.status, "confirmed");

    const latestOrder = await getOrder(harness, setup.orderId, setup.accessToken);
    assert.equal(latestOrder.status, "confirmed");
    assert.equal(latestOrder.paymentRecords.at(-1)?.payStatus, "paid");
    assert.equal(
      latestOrder.statusLogs.filter((entry) => entry.toStatus === "confirmed").length,
      1
    );
  });

  test("订单过期取消后，迟到 callback 会被拒绝并写入补偿日志", async () => {
    const setup = await createPendingPaidOrder(harness);

    await harness.prisma.order.update({
      where: {
        id: setup.orderId
      },
      data: {
        expireAt: new Date(Date.now() - 1_000)
      }
    });

    const expirationResponse = await harness.runExpirePendingOrders();
    assert.equal(expirationResponse.status, 201);

    const cancelledOrder = await getOrder(harness, setup.orderId, setup.accessToken);
    assert.equal(cancelledOrder.status, "cancelled");
    assert.equal(cancelledOrder.paymentRecords.at(-1)?.payStatus, "failed");

    const callbackResponse = await harness.request(
      "/payments/mock/callback",
      {
        method: "POST",
        accessToken: setup.accessToken,
        body: {
          transactionNo: setup.transactionNo
        }
      }
    );

    assert.equal(callbackResponse.status, 409);

    const compensationLogs = await harness.prisma.paymentCompensationLog.findMany({
      where: {
        transactionNo: setup.transactionNo
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    assert.equal(compensationLogs.length, 1);
    assert.equal(
      compensationLogs[0]?.type,
      PaymentCompensationType.LATE_CALLBACK_REJECTED
    );
    assert.equal(compensationLogs[0]?.paymentStatus, PaymentStatus.FAILED);
  });

  test("最后一秒支付与同时过期取消对撞时只有一个最终赢家", async () => {
    const setup = await createPendingPaidOrder(harness);

    await harness.prisma.order.update({
      where: {
        id: setup.orderId
      },
      data: {
        expireAt: new Date()
      }
    });

    const [callbackResponse, expirationResponse] = await Promise.all([
      harness.request<OrderDetailResponse>("/payments/mock/callback", {
        method: "POST",
        accessToken: setup.accessToken,
        body: {
          transactionNo: setup.transactionNo
        }
      }),
      harness.runExpirePendingOrders()
    ]);

    assert.equal(expirationResponse.status, 201);
    assert.ok([201, 409].includes(callbackResponse.status));

    const latestOrder = await getOrder(harness, setup.orderId, setup.accessToken);
    const terminalLogs = latestOrder.statusLogs.filter(
      (entry) =>
        entry.toStatus === "confirmed" || entry.toStatus === "cancelled"
    );
    const compensationCount = await harness.prisma.paymentCompensationLog.count({
      where: {
        transactionNo: setup.transactionNo
      }
    });

    assert.equal(terminalLogs.length, 1);
    assert.ok(["confirmed", "cancelled"].includes(latestOrder.status));

    if (latestOrder.status === "confirmed") {
      assert.equal(latestOrder.paymentRecords.at(-1)?.payStatus, "paid");
      assert.equal(compensationCount, 0);
      return;
    }

    assert.equal(latestOrder.paymentRecords.at(-1)?.payStatus, "failed");
    assert.equal(compensationCount, 1);
  });
});

async function createPendingPaidOrder(harness: IntegrationHarness) {
  const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
    title: "Red Bird Ghost Payment Race",
    stock: 2,
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
  await harness.waitForActivityQueueIdle();

  const registrationStatus =
    await harness.request<ActivityRegistrationStatusResponse>(
      `/activities/${activityId}/registration-status`,
      {
        accessToken
      }
    );

  assert.equal(registrationStatus.status, 200);
  assert.equal(registrationStatus.payload?.status, "pending_confirmation");
  assert.ok(registrationStatus.payload?.orderId);

  const mockPayment = await harness.request<MockPaymentStartResponse>(
    `/payments/orders/${registrationStatus.payload?.orderId}/mock`,
    {
      method: "POST",
      accessToken
    }
  );

  assert.equal(mockPayment.status, 201);
  assert.ok(mockPayment.payload?.transactionNo);

  return {
    accessToken,
    orderId: registrationStatus.payload!.orderId!,
    transactionNo: mockPayment.payload!.transactionNo
  };
}

async function getOrder(
  harness: IntegrationHarness,
  orderId: string,
  accessToken: string
) {
  const orderDetail = await harness.request<OrderDetailResponse>(`/orders/${orderId}`, {
    accessToken
  });

  assert.equal(orderDetail.status, 200);
  assert.ok(orderDetail.payload);
  return orderDetail.payload;
}
