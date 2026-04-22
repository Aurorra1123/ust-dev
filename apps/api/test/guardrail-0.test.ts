import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { OrderStatus } from "@prisma/client";

import {
  type IntegrationHarness,
  createIntegrationHarness
} from "./integration-harness";

process.on("unhandledRejection", (reason) => {
  console.error("guardrail-unhandled-rejection", reason);
});

process.on("uncaughtException", (error) => {
  console.error("guardrail-uncaught-exception", error);
});

describe("Guardrail-0 API regressions", { concurrency: 1 }, () => {
  let harness: IntegrationHarness;

  before(async () => {
    harness = await createIntegrationHarness();
  });

  after(async () => {
    await harness.close();
  });

  test("API-001 学术预约缓冲贴脸冲突应被拒绝", async () => {
    const demoToken = await harness.loginDemoStudent();
    const partnerToken = await harness.login("partner1@campusbook.top");

    const initial = await harness.request("/reservations/academic", {
      method: "POST",
      accessToken: demoToken,
      body: {
        resourceUnitId: "unit_academic_demo",
        startTime: "2030-05-10T10:00:00.000Z",
        endTime: "2030-05-10T11:00:00.000Z"
      }
    });

    assert.equal(initial.status, 201);

    const conflict = await harness.request("/reservations/academic", {
      method: "POST",
      accessToken: partnerToken,
      body: {
        resourceUnitId: "unit_academic_demo",
        startTime: "2030-05-10T11:04:00.000Z",
        endTime: "2030-05-10T12:04:00.000Z"
      }
    });

    assert.equal(conflict.status, 409);
  });

  test("API-002 学术预约缓冲精确边界应放行", async () => {
    const demoToken = await harness.loginDemoStudent();
    const partnerToken = await harness.login("partner1@campusbook.top");

    const firstReservation = await harness.request("/reservations/academic", {
      method: "POST",
      accessToken: demoToken,
      body: {
        resourceUnitId: "unit_academic_demo",
        startTime: "2030-05-11T10:00:00.000Z",
        endTime: "2030-05-11T11:00:00.000Z"
      }
    });

    const boundaryReservation = await harness.request("/reservations/academic", {
      method: "POST",
      accessToken: partnerToken,
      body: {
        resourceUnitId: "unit_academic_demo",
        startTime: "2030-05-11T11:05:00.000Z",
        endTime: "2030-05-11T12:05:00.000Z"
      }
    });

    assert.equal(firstReservation.status, 201);
    assert.equal(boundaryReservation.status, 201);
  });

  test("API-004 学术同房同段并发只能成功一单", async () => {
    const demoToken = await harness.loginDemoStudent();
    const partnerToken = await harness.login("partner1@campusbook.top");

    const [left, right] = await Promise.all([
      harness.request("/reservations/academic", {
        method: "POST",
        accessToken: demoToken,
        body: {
          resourceUnitId: "unit_academic_demo",
          startTime: "2030-05-12T10:00:00.000Z",
          endTime: "2030-05-12T11:00:00.000Z"
        }
      }),
      harness.request("/reservations/academic", {
        method: "POST",
        accessToken: partnerToken,
        body: {
          resourceUnitId: "unit_academic_demo",
          startTime: "2030-05-12T10:00:00.000Z",
          endTime: "2030-05-12T11:00:00.000Z"
        }
      })
    ]);

    const statuses = [left.status, right.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [201, 409]);
  });

  test("API-007 体育同场同 slot 并发只能成功一单", async () => {
    const demoToken = await harness.loginDemoStudent();
    const partnerToken = await harness.login("partner1@campusbook.top");

    const [left, right] = await Promise.all([
      harness.request("/reservations/sports", {
        method: "POST",
        accessToken: demoToken,
        body: {
          resourceUnitId: "unit_sports_demo_a",
          slotStarts: ["2030-05-13T10:00:00.000Z"]
        }
      }),
      harness.request("/reservations/sports", {
        method: "POST",
        accessToken: partnerToken,
        body: {
          resourceUnitId: "unit_sports_demo_a",
          slotStarts: ["2030-05-13T10:00:00.000Z"]
        }
      })
    ]);

    const statuses = [left.status, right.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [201, 409]);
  });

  test("API-008 组合预约任一成员冲突时整单失败且不留下半成品", async () => {
    const demoToken = await harness.loginDemoStudent();
    const partnerToken = await harness.login("partner1@campusbook.top");
    const targetSlot = new Date("2030-05-14T10:00:00.000Z");

    const baselineOrderCount = await harness.prisma.order.count({
      where: {
        user: {
          is: {
            email: TEST_DEMO_EMAIL
          }
        }
      }
    });
    const baselineSlotCount = await harness.prisma.sportsReservationSlot.count({
      where: {
        user: {
          is: {
            email: TEST_DEMO_EMAIL
          }
        }
      }
    });

    const singleReservation = await harness.request("/reservations/sports", {
      method: "POST",
      accessToken: partnerToken,
      body: {
        resourceUnitId: "unit_sports_demo_b",
        slotStarts: [targetSlot.toISOString()]
      }
    });

    const groupAttempt = await harness.request("/reservations/sports", {
      method: "POST",
      accessToken: demoToken,
      body: {
        resourceGroupId: "group_sports_demo_pair",
        slotStarts: [targetSlot.toISOString()]
      }
    });

    const afterOrderCount = await harness.prisma.order.count({
      where: {
        user: {
          is: {
            email: TEST_DEMO_EMAIL
          }
        }
      }
    });
    const afterSlotCount = await harness.prisma.sportsReservationSlot.count({
      where: {
        user: {
          is: {
            email: TEST_DEMO_EMAIL
          }
        }
      }
    });

    assert.equal(singleReservation.status, 201);
    assert.equal(groupAttempt.status, 409);
    assert.equal(afterOrderCount, baselineOrderCount);
    assert.equal(afterSlotCount, baselineSlotCount);
  });

  test("API-009 单场与组合资源并发对撞时只能留下一个赢家", async () => {
    const demoToken = await harness.loginDemoStudent();
    const partnerToken = await harness.login("partner1@campusbook.top");
    const targetSlot = "2030-05-15T10:00:00.000Z";

    const [groupAttempt, singleAttempt] = await Promise.all([
      harness.request("/reservations/sports", {
        method: "POST",
        accessToken: demoToken,
        body: {
          resourceGroupId: "group_sports_demo_pair",
          slotStarts: [targetSlot]
        }
      }),
      harness.request("/reservations/sports", {
        method: "POST",
        accessToken: partnerToken,
        body: {
          resourceUnitId: "unit_sports_demo_a",
          slotStarts: [targetSlot]
        }
      })
    ]);

    const statuses = [groupAttempt.status, singleAttempt.status].sort(
      (a, b) => a - b
    );
    const slots = await harness.prisma.sportsReservationSlot.findMany({
      where: {
        slotStart: new Date(targetSlot),
        resourceUnitId: {
          in: ["unit_sports_demo_a", "unit_sports_demo_b"]
        },
        status: OrderStatus.CONFIRMED
      },
      select: {
        orderId: true
      }
    });

    assert.deepEqual(statuses, [201, 409]);
    assert.equal(new Set(slots.map((slot) => slot.orderId)).size, 1);
  });

  test("API-010 同用户并发抢同票只能保留一条有效报名", async () => {
    const demoToken = await harness.loginDemoStudent();
    const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
      title: "Guardrail Duplicate Pending Fixture",
      stock: 4
    });

    const [firstAttempt, secondAttempt] = await Promise.all([
      harness.request(`/activities/${activityId}/grab`, {
        method: "POST",
        accessToken: demoToken,
        body: {
          ticketId
        }
      }),
      harness.request(`/activities/${activityId}/grab`, {
        method: "POST",
        accessToken: demoToken,
        body: {
          ticketId
        }
      })
    ]);

    await harness.waitForActivityQueueIdle();

    const registrations = await harness.prisma.activityRegistration.findMany({
      where: {
        activityId,
        user: {
          is: {
            email: TEST_DEMO_EMAIL
          }
        },
        status: {
          in: [OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED, OrderStatus.NO_SHOW]
        }
      },
      include: {
        order: true
      }
    });

    const statuses = [firstAttempt.status, secondAttempt.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [201, 409]);
    assert.equal(registrations.length, 1);
    assert.equal(registrations[0]?.order.status, OrderStatus.CONFIRMED);
  });

  test("API-011 超库存高并发下绝不超卖", async () => {
    const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
      title: "Guardrail Oversell Fixture",
      stock: 2
    });
    const emails = await harness.createStudentUsers("guardrail-oversell", 6);
    const accessTokens = await Promise.all(
      emails.map((email) => harness.login(email))
    );

    const responses = await Promise.all(
      accessTokens.map((accessToken) =>
        harness.request(`/activities/${activityId}/grab`, {
          method: "POST",
          accessToken,
          body: {
            ticketId
          }
        })
      )
    );

    await harness.waitForActivityQueueIdle();

    const successfulSubmissions = responses.filter(
      (response) => response.status === 201
    ).length;
    const ticket = await harness.prisma.activityTicket.findUniqueOrThrow({
      where: {
        id: ticketId
      }
    });
    const registrations = await harness.prisma.activityRegistration.findMany({
      where: {
        activityId,
        status: OrderStatus.CONFIRMED
      }
    });
    const orders = await harness.prisma.order.findMany({
      where: {
        activityId,
        status: OrderStatus.CONFIRMED
      }
    });

    assert.equal(successfulSubmissions, 2);
    assert.equal(ticket.reserved, 2);
    assert.equal(registrations.length, 2);
    assert.equal(orders.length, 2);
    assert.ok(ticket.reserved <= ticket.stock);
  });
});

const TEST_DEMO_EMAIL = "demo@campusbook.top";
