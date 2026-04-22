#!/usr/bin/env node

import { setTimeout as delay } from "node:timers/promises";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function startOfFutureHour(hoursFromNow) {
  const value = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  value.setUTCMinutes(0, 0, 0);

  if (value.getTime() <= Date.now()) {
    value.setUTCHours(value.getUTCHours() + 1);
  }

  return value;
}

function addMinutes(value, minutes) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function addDays(value, days) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

async function request(baseUrl, path, options = {}) {
  const {
    method = "GET",
    body,
    accessToken,
    expectedStatus = 200,
    responseType = "json"
  } = options;
  const headers = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload =
    response.status === 204
      ? null
      : responseType === "text"
        ? await response.text()
        : await response.json();
  const expectedStatuses = asArray(expectedStatus);

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${method} ${baseUrl}${path} 预期 ${expectedStatuses.join("/")}，实际 ${response.status}，响应：${typeof payload === "string" ? payload : JSON.stringify(payload)}`
    );
  }

  return {
    status: response.status,
    payload,
    headers: response.headers
  };
}

async function login({
  apiBaseUrl,
  role,
  email,
  password,
  expectedRefreshCookiePath
}) {
  const response = await request(apiBaseUrl, "/auth/login", {
    method: "POST",
    body: {
      email,
      password
    }
  });

  assert(response.payload?.accessToken, `${role} 登录缺少 accessToken`);
  assert(response.payload?.user?.role === role, `${role} 登录角色不匹配`);

  if (expectedRefreshCookiePath) {
    const setCookie = response.headers.get("set-cookie") ?? "";
    assert(
      setCookie.includes(`Path=${expectedRefreshCookiePath}`),
      `${role} 登录返回的 refresh cookie 未重写到 ${expectedRefreshCookiePath}`
    );
  }

  return response.payload;
}

async function waitForRegistrationStatus({
  apiBaseUrl,
  activityId,
  accessToken,
  timeoutMs,
  logLabel
}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await request(
      apiBaseUrl,
      `/activities/${activityId}/registration-status`,
      {
        accessToken,
        expectedStatus: [200, 404]
      }
    );

    if (response.status === 404) {
      await delay(250);
      continue;
    }

    if (
      response.payload?.status === "pending_confirmation" ||
      response.payload?.status === "confirmed"
    ) {
      return response.payload;
    }

    if (response.payload?.status === "failed") {
      throw new Error(
        `[${logLabel}] 活动报名进入 failed：${response.payload?.reason ?? "unknown"}`
      );
    }

    await delay(250);
  }

  throw new Error(`[${logLabel}] 等待活动订单生成超时，worker 可能未工作`);
}

async function cancelOrderAndAssert({
  apiBaseUrl,
  orderId,
  accessToken,
  reason
}) {
  const cancelResponse = await request(apiBaseUrl, `/orders/${orderId}/cancel`, {
    method: "POST",
    accessToken,
    expectedStatus: 201,
    body: {
      reason
    }
  });

  assert(cancelResponse.payload?.status === "cancelled", `订单 ${orderId} 未成功取消`);
  return cancelResponse.payload;
}

export async function runSmokeSuite({
  label,
  webBaseUrl,
  apiBaseUrl,
  wwwBaseUrl,
  expectedRefreshCookiePath,
  studentEmail,
  studentPassword,
  adminEmail,
  adminPassword
}) {
  console.log(`[${label}] web=${webBaseUrl}`);
  if (wwwBaseUrl) {
    console.log(`[${label}] www=${wwwBaseUrl}`);
  }
  console.log(`[${label}] api=${apiBaseUrl}`);

  const homeHtml = await request(webBaseUrl, "/", {
    responseType: "text"
  });
  assert(homeHtml.payload.includes("<title>CampusBook</title>"), "首页未返回 CampusBook 标题");

  if (wwwBaseUrl) {
    const wwwHtml = await request(wwwBaseUrl, "/", {
      responseType: "text"
    });
    assert(wwwHtml.payload.includes("<div id=\"root\"></div>"), "www 首页未返回前端根节点");
  }

  const health = await request(apiBaseUrl, "/health");
  assert(health.payload?.status === "ok", "健康检查状态不是 ok");
  assert(health.payload?.dependencies?.postgres === "up", "PostgreSQL 未就绪");
  assert(health.payload?.dependencies?.redis === "up", "Redis 未就绪");

  const studentSession = await login({
    apiBaseUrl,
    role: "student",
    email: studentEmail,
    password: studentPassword,
    expectedRefreshCookiePath
  });
  const adminSession = await login({
    apiBaseUrl,
    role: "admin",
    email: adminEmail,
    password: adminPassword,
    expectedRefreshCookiePath
  });

  const [academicResources, sportsResources, activities, orders, adminResources, adminActivities, adminRules] =
    await Promise.all([
      request(apiBaseUrl, "/resources?type=academic_space", {
        accessToken: studentSession.accessToken
      }),
      request(apiBaseUrl, "/resources?type=sports_facility", {
        accessToken: studentSession.accessToken
      }),
      request(apiBaseUrl, "/activities", {
        accessToken: studentSession.accessToken
      }),
      request(apiBaseUrl, "/orders", {
        accessToken: studentSession.accessToken
      }),
      request(apiBaseUrl, "/admin/resources", {
        accessToken: adminSession.accessToken
      }),
      request(apiBaseUrl, "/admin/activities", {
        accessToken: adminSession.accessToken
      }),
      request(apiBaseUrl, "/admin/rules", {
        accessToken: adminSession.accessToken
      })
    ]);

  assert(
    Array.isArray(academicResources.payload) && academicResources.payload.length > 0,
    "学生视角未查询到学术空间资源"
  );
  assert(
    Array.isArray(sportsResources.payload) && sportsResources.payload.length > 0,
    "学生视角未查询到体育资源"
  );
  assert(Array.isArray(activities.payload), "学生视角活动列表返回格式异常");
  assert(Array.isArray(orders.payload), "学生视角订单列表返回格式异常");
  assert(
    Array.isArray(adminResources.payload) && adminResources.payload.length > 0,
    "管理员视角未查询到资源"
  );
  assert(
    Array.isArray(adminActivities.payload) && adminActivities.payload.length > 0,
    "管理员视角未查询到活动"
  );
  assert(Array.isArray(adminRules.payload) && adminRules.payload.length > 0, "管理员视角未查询到规则");

  const academicResource = academicResources.payload[0];
  const academicUnit = academicResource?.units?.[0];
  const sportsResource = sportsResources.payload[0];
  const sportsUnit = sportsResource?.units?.[0];
  assert(academicUnit?.id, "缺少可用学术单元");
  assert(sportsUnit?.id, "缺少可用体育单元");

  const baseHour = startOfFutureHour(72);
  const academicStart = baseHour;
  const academicEnd = addMinutes(academicStart, 60);
  const sportsSlot = addMinutes(baseHour, 120);
  const ruleProbeStart = addMinutes(baseHour, 240);
  const ruleProbeEnd = addMinutes(ruleProbeStart, 121);

  const ruleHit = await request(apiBaseUrl, "/reservations/academic", {
    method: "POST",
    accessToken: studentSession.accessToken,
    expectedStatus: 400,
    body: {
      resourceUnitId: academicUnit.id,
      startTime: ruleProbeStart.toISOString(),
      endTime: ruleProbeEnd.toISOString()
    }
  });

  assert(
    String(ruleHit.payload?.message ?? "").includes("rule-max-duration-exceeded"),
    "学术规则命中没有返回最大时长限制"
  );

  const academicReservation = await request(apiBaseUrl, "/reservations/academic", {
    method: "POST",
    accessToken: studentSession.accessToken,
    expectedStatus: 201,
    body: {
      resourceUnitId: academicUnit.id,
      startTime: academicStart.toISOString(),
      endTime: academicEnd.toISOString()
    }
  });
  assert(academicReservation.payload?.orderId, "学术预约缺少 orderId");

  const academicCancelled = await cancelOrderAndAssert({
    apiBaseUrl,
    orderId: academicReservation.payload.orderId,
    accessToken: studentSession.accessToken,
    reason: `${label}-academic-cleanup`
  });

  const sportsReservation = await request(apiBaseUrl, "/reservations/sports", {
    method: "POST",
    accessToken: studentSession.accessToken,
    expectedStatus: 201,
    body: {
      resourceUnitId: sportsUnit.id,
      slotStarts: [sportsSlot.toISOString()]
    }
  });
  assert(sportsReservation.payload?.orderId, "体育预约缺少 orderId");

  const sportsCancelled = await cancelOrderAndAssert({
    apiBaseUrl,
    orderId: sportsReservation.payload.orderId,
    accessToken: studentSession.accessToken,
    reason: `${label}-sports-cleanup`
  });

  const smokeActivity = await request(apiBaseUrl, "/admin/activities", {
    method: "POST",
    accessToken: adminSession.accessToken,
    expectedStatus: 201,
    body: {
      title: `[${label}] Red Bird 5 RMB Ticket ${Date.now()}`,
      description: `${label} paid activity confirmation flow`,
      location: "Judge Hall",
      totalQuota: 1,
      saleStartTime: addDays(new Date(), -1).toISOString(),
      saleEndTime: addDays(new Date(), 7).toISOString(),
      eventStartTime: addDays(new Date(), 14).toISOString(),
      eventEndTime: addDays(new Date(), 14.1).toISOString(),
      status: "published",
      tickets: [
        {
          name: "General Admission",
          stock: 1,
          priceCents: 500,
          status: "active"
        }
      ]
    }
  });
  const smokeActivityId = smokeActivity.payload?.id;
  const smokeTicketId = smokeActivity.payload?.tickets?.[0]?.id;
  assert(smokeActivityId && smokeTicketId, "付费 smoke 活动未正确创建");

  const grabResponse = await request(apiBaseUrl, `/activities/${smokeActivityId}/grab`, {
    method: "POST",
    accessToken: studentSession.accessToken,
    expectedStatus: 201,
    body: {
      ticketId: smokeTicketId
    }
  });
  assert(grabResponse.payload?.requestStatus === "queued", "活动抢票未进入 queued");

  const registrationStatus = await waitForRegistrationStatus({
    apiBaseUrl,
    activityId: smokeActivityId,
    accessToken: studentSession.accessToken,
    timeoutMs: 10_000,
    logLabel: label
  });

  assert(
    registrationStatus.status === "pending_confirmation",
    "付费活动未进入 pending_confirmation"
  );
  assert(registrationStatus.orderId, "付费活动缺少订单号");

  const payment = await request(
    apiBaseUrl,
    `/payments/orders/${registrationStatus.orderId}/mock`,
    {
      method: "POST",
      accessToken: studentSession.accessToken,
      expectedStatus: 201
    }
  );
  assert(payment.payload?.transactionNo, "mock 支付缺少 transactionNo");

  const confirmedOrder = await request(apiBaseUrl, "/payments/mock/callback", {
    method: "POST",
    accessToken: studentSession.accessToken,
    expectedStatus: 201,
    body: {
      transactionNo: payment.payload.transactionNo
    }
  });
  assert(confirmedOrder.payload?.status === "confirmed", "付费订单未被确认");

  const orderDetail = await request(apiBaseUrl, `/orders/${registrationStatus.orderId}`, {
    accessToken: studentSession.accessToken
  });
  assert(orderDetail.payload?.status === "confirmed", "订单详情未返回 confirmed");
  assert(
    orderDetail.payload?.paymentRecords?.at(-1)?.payStatus === "paid",
    "订单详情未返回 paid payment record"
  );

  await request(apiBaseUrl, `/admin/activities/${smokeActivityId}`, {
    method: "PATCH",
    accessToken: adminSession.accessToken,
    expectedStatus: 200,
    body: {
      status: "cancelled"
    }
  });

  const finalOrders = await request(apiBaseUrl, "/orders", {
    accessToken: studentSession.accessToken
  });
  assert(
    Array.isArray(finalOrders.payload) &&
      finalOrders.payload.some((order) => order.id === registrationStatus.orderId),
    "最终订单列表中未找到付费活动订单"
  );

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checkedAt: new Date().toISOString(),
        scenarios: {
          ruleHit: {
            resourceUnitId: academicUnit.id,
            status: ruleHit.status,
            message: ruleHit.payload?.message ?? null
          },
          academicReservation: {
            orderId: academicReservation.payload.orderId,
            finalStatus: academicCancelled.status
          },
          sportsReservation: {
            orderId: sportsReservation.payload.orderId,
            finalStatus: sportsCancelled.status
          },
          paidActivity: {
            activityId: smokeActivityId,
            orderId: registrationStatus.orderId,
            paymentStatus: orderDetail.payload?.paymentRecords?.at(-1)?.payStatus,
            finalStatus: orderDetail.payload?.status
          }
        }
      },
      null,
      2
    )
  );
}
