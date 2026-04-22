import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import type {
  MockPaymentStartResponse,
  OrderDetailResponse
} from "@campusbook/shared-types";

import {
  type IntegrationHarness,
  createIntegrationHarness
} from "./integration-harness";

describe("COMP-001 paid activity payment path", { concurrency: 1 }, () => {
  let harness: IntegrationHarness;

  before(async () => {
    harness = await createIntegrationHarness();
  });

  after(async () => {
    await harness.close();
  });

  test("付费活动票应创建为 pending_confirmation 并写入 PaymentRecord(PENDING)", async () => {
    const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
      title: "Red Bird Music Festival",
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
    const registrationStatus = await harness.waitForRegistrationStatus(
      activityId,
      accessToken,
      "pending_confirmation"
    );
    assert.ok(registrationStatus.orderId);

    const orderDetail = await harness.request<OrderDetailResponse>(
      `/orders/${registrationStatus.orderId}`,
      {
        accessToken
      }
    );

    assert.equal(orderDetail.status, 200);
    assert.equal(orderDetail.payload?.status, "pending_confirmation");
    assert.equal(orderDetail.payload?.totalAmountCents, 500);
    assert.ok(orderDetail.payload?.expireAt);
    assert.equal(orderDetail.payload?.paymentRecords.length, 1);
    assert.equal(orderDetail.payload?.paymentRecords[0]?.payStatus, "pending");
    assert.equal(orderDetail.payload?.paymentRecords[0]?.amountCents, 500);
  });

  test("mock payment callback 后订单应转为 confirmed 且支付记录转为 paid", async () => {
    const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
      title: "Red Bird Music Festival Payment Callback",
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
    assert.equal(mockPayment.payload?.amountCents, 500);
    assert.equal(mockPayment.payload?.payStatus, "pending");
    assert.ok(mockPayment.payload?.transactionNo);

    const callbackResponse = await harness.request<OrderDetailResponse>(
      "/payments/mock/callback",
      {
        method: "POST",
        accessToken,
        body: {
          transactionNo: mockPayment.payload?.transactionNo
        }
      }
    );

    assert.equal(callbackResponse.status, 201);
    assert.equal(callbackResponse.payload?.status, "confirmed");
    assert.equal(
      callbackResponse.payload?.paymentRecords.at(-1)?.payStatus,
      "paid"
    );

    const confirmedOrder = await harness.request<OrderDetailResponse>(
      `/orders/${registrationStatus.orderId}`,
      {
        accessToken
      }
    );

    assert.equal(confirmedOrder.status, 200);
    assert.equal(confirmedOrder.payload?.status, "confirmed");
    assert.equal(confirmedOrder.payload?.paymentRecords.at(-1)?.payStatus, "paid");
    assert.equal(
      confirmedOrder.payload?.paymentRecords.at(-1)?.transactionNo,
      mockPayment.payload?.transactionNo
    );
  });
});
