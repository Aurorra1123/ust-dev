#!/usr/bin/env node

const apiBaseUrl = process.env.SMOKE_API_BASE_URL ?? "http://api.campusbook.top";
const webBaseUrl = process.env.SMOKE_WEB_BASE_URL ?? "http://campusbook.top";
const wwwBaseUrl = process.env.SMOKE_WWW_BASE_URL ?? "http://www.campusbook.top";

const studentEmail = process.env.SMOKE_STUDENT_EMAIL ?? "demo@campusbook.top";
const studentPassword = process.env.SMOKE_STUDENT_PASSWORD ?? "demo123456";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@campusbook.top";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "admin123456";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
    responseType === "text" ? await response.text() : await response.json();

  if (response.status !== expectedStatus) {
    throw new Error(
      `${method} ${baseUrl}${path} 预期 ${expectedStatus}，实际 ${response.status}，响应：${typeof payload === "string" ? payload : JSON.stringify(payload)}`
    );
  }

  return payload;
}

async function login(role, email, password) {
  const session = await request(apiBaseUrl, "/auth/login", {
    method: "POST",
    body: {
      email,
      password
    }
  });

  assert(session?.accessToken, `${role} 登录缺少 accessToken`);
  assert(session?.user?.role === role, `${role} 登录角色不匹配`);

  return session;
}

async function main() {
  console.log(`[smoke] web=${webBaseUrl}`);
  console.log(`[smoke] www=${wwwBaseUrl}`);
  console.log(`[smoke] api=${apiBaseUrl}`);

  const homeHtml = await request(webBaseUrl, "/", {
    responseType: "text"
  });
  assert(
    homeHtml.includes("<title>CampusBook</title>"),
    "裸域首页未返回 CampusBook 标题"
  );

  const wwwHtml = await request(wwwBaseUrl, "/", {
    responseType: "text"
  });
  assert(
    wwwHtml.includes("<div id=\"root\"></div>"),
    "www 首页未返回前端根节点"
  );

  const health = await request(apiBaseUrl, "/health");
  assert(health.status === "ok", "健康检查状态不是 ok");
  assert(health.dependencies?.postgres === "up", "PostgreSQL 未就绪");
  assert(health.dependencies?.redis === "up", "Redis 未就绪");

  const studentSession = await login("student", studentEmail, studentPassword);
  const academicResources = await request(
    apiBaseUrl,
    "/resources?type=academic_space",
    {
      accessToken: studentSession.accessToken
    }
  );
  const activities = await request(apiBaseUrl, "/activities", {
    accessToken: studentSession.accessToken
  });
  const orders = await request(apiBaseUrl, "/orders", {
    accessToken: studentSession.accessToken
  });

  assert(
    Array.isArray(academicResources) && academicResources.length > 0,
    "学生视角未查询到学术空间资源"
  );
  assert(Array.isArray(activities), "学生视角活动列表返回格式异常");
  assert(Array.isArray(orders), "学生视角订单列表返回格式异常");

  const adminSession = await login("admin", adminEmail, adminPassword);
  const adminResources = await request(apiBaseUrl, "/admin/resources", {
    accessToken: adminSession.accessToken
  });
  const adminActivities = await request(apiBaseUrl, "/admin/activities", {
    accessToken: adminSession.accessToken
  });
  const adminRules = await request(apiBaseUrl, "/admin/rules", {
    accessToken: adminSession.accessToken
  });

  assert(
    Array.isArray(adminResources) && adminResources.length > 0,
    "管理员视角未查询到资源"
  );
  assert(
    Array.isArray(adminActivities) && adminActivities.length > 0,
    "管理员视角未查询到活动"
  );
  assert(Array.isArray(adminRules) && adminRules.length > 0, "管理员视角未查询到规则");

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checkedAt: new Date().toISOString(),
        counts: {
          academicResources: academicResources.length,
          activities: activities.length,
          orders: orders.length,
          adminResources: adminResources.length,
          adminActivities: adminActivities.length,
          adminRules: adminRules.length
        }
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[smoke] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
