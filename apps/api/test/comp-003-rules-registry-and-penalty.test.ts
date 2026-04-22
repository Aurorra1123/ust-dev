import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";

import type {
  AcademicReservationResponse,
  ActivityRegistrationStatusResponse,
  AppRule
} from "@campusbook/shared-types";
import { ReservationCategory } from "@prisma/client";

import { OrdersService } from "../src/modules/orders/orders.service";
import {
  type IntegrationHarness,
  createIntegrationHarness
} from "./integration-harness";

describe("COMP-003 rules registry and penalty chain", { concurrency: 1 }, () => {
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

  test("活动报名资格规则会进入真实抢票主链路", async () => {
    const adminToken = await harness.loginDemoAdmin();
    const studentToken = await harness.loginDemoStudent();
    const { activityId, ticketId } = await harness.createPublishedActivityWithTicket({
      title: "Activity Eligibility Fixture",
      stock: 2
    });

    const createRuleResponse = await harness.request<AppRule>("/admin/rules", {
      method: "POST",
      accessToken: adminToken,
      body: {
        name: "Activity Credit Gate",
        ruleType: "min_credit_score",
        expression: {
          min: 101
        },
        status: "active"
      }
    });

    assert.equal(createRuleResponse.status, 201);

    const grabResponse = await harness.request(`/activities/${activityId}/grab`, {
      method: "POST",
      accessToken: studentToken,
      body: {
        ticketId
      }
    });

    assert.equal(grabResponse.status, 403);

    const statusResponse =
      await harness.request<ActivityRegistrationStatusResponse>(
        `/activities/${activityId}/registration-status`,
        {
          accessToken: studentToken
        }
      );

    assert.equal(statusResponse.status, 404);
  });

  test("最大可预约次数规则会通过 handler registry 阻止超额预约", async () => {
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
        name: "Academic Active Reservation Limit",
        ruleType: "max_active_reservations_per_category",
        expression: {
          max: 1
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

    const firstReservation =
      await harness.request<AcademicReservationResponse>("/reservations/academic", {
        method: "POST",
        accessToken: studentToken,
        body: {
          resourceUnitId: "unit_academic_demo",
          startTime: "2030-06-10T10:00:00.000Z",
          endTime: "2030-06-10T11:00:00.000Z"
        }
      });

    const secondReservation =
      await harness.request("/reservations/academic", {
        method: "POST",
        accessToken: studentToken,
        body: {
          resourceUnitId: "unit_academic_demo",
          startTime: "2030-06-10T13:00:00.000Z",
          endTime: "2030-06-10T14:00:00.000Z"
        }
      });

    assert.equal(firstReservation.status, 201);
    assert.equal(secondReservation.status, 400);
  });

  test("爽约处罚规则会写入信用分日志、用户画像和禁用记录", async () => {
    const adminToken = await harness.loginDemoAdmin();
    const student = await harness.prisma.user.findUniqueOrThrow({
      where: {
        email: "demo@campusbook.top"
      },
      select: {
        id: true,
        creditScore: true
      }
    });
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
        name: "Academic No-show Penalty",
        ruleType: "no_show_credit_penalty",
        expression: {
          scoreDelta: 15,
          banDays: 2
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

    const reservationResponse =
      await harness.request<AcademicReservationResponse>("/reservations/academic", {
        method: "POST",
        accessToken: studentToken,
        body: {
          resourceUnitId: "unit_academic_demo",
          startTime: "2030-06-11T10:00:00.000Z",
          endTime: "2030-06-11T11:00:00.000Z"
        }
      });

    assert.equal(reservationResponse.status, 201);
    assert.ok(reservationResponse.payload);

    const ordersService = harness.getApiService<OrdersService>(OrdersService);
    const finalized = await ordersService.finalizeReservationAttendance(
      reservationResponse.payload.orderId
    );

    assert.equal(finalized?.status, "no_show");

    const updatedUser = await harness.prisma.user.findUniqueOrThrow({
      where: {
        id: student.id
      },
      select: {
        creditScore: true
      }
    });
    const creditLogs = await harness.prisma.userCreditLog.findMany({
      where: {
        userId: student.id
      }
    });
    const userRuleProfile = await harness.prisma.userRuleProfile.findUnique({
      where: {
        userId_ruleId: {
          userId: student.id,
          ruleId: createRuleResponse.payload.id
        }
      }
    });
    const restriction = await harness.prisma.userReservationRestriction.findUnique({
      where: {
        userId_category: {
          userId: student.id,
          category: ReservationCategory.ACADEMIC_SPACE
        }
      }
    });

    assert.equal(updatedUser.creditScore, student.creditScore - 15);
    assert.equal(creditLogs.length, 1);
    assert.equal(creditLogs[0]?.scoreDelta, -15);
    assert.ok(userRuleProfile);
    assert.ok(userRuleProfile?.profileValue);
    assert.ok(restriction?.bannedUntil);
  });
});
