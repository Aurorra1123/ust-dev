#!/usr/bin/env node

const webBaseUrl = process.env.SMOKE_WEB_BASE_URL ?? "http://nginx";
const apiBaseUrl = process.env.SMOKE_API_BASE_URL ?? "http://nginx/api";

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

  return {
    payload,
    headers: response.headers
  };
}

async function login(role, email, password) {
  const { payload, headers } = await request(apiBaseUrl, "/auth/login", {
    method: "POST",
    body: {
      email,
      password
    }
  });

  assert(payload?.accessToken, `${role} 登录缺少 accessToken`);
  assert(payload?.user?.role === role, `${role} 登录角色不匹配`);

  const setCookie = headers.get("set-cookie") ?? "";
  assert(
    setCookie.includes("Path=/api/auth"),
    `${role} 登录返回的 refresh cookie 未重写到 /api/auth`
  );

  return payload;
}

async function main() {
  console.log(`[judge-smoke] web=${webBaseUrl}`);
  console.log(`[judge-smoke] api=${apiBaseUrl}`);

  const homeHtml = await request(webBaseUrl, "/", {
    responseType: "text"
  });
  assert(
    homeHtml.payload.includes("<title>CampusBook</title>"),
    "judge 首页未返回 CampusBook 标题"
  );

  const health = await request(apiBaseUrl, "/health");
  assert(health.payload.status === "ok", "健康检查状态不是 ok");
  assert(health.payload.dependencies?.postgres === "up", "PostgreSQL 未就绪");
  assert(health.payload.dependencies?.redis === "up", "Redis 未就绪");

  const studentSession = await login("student", studentEmail, studentPassword);
  const academicResources = await request(
    apiBaseUrl,
    "/resources?type=academic_space",
    {
      accessToken: studentSession.accessToken
    }
  );
  assert(
    Array.isArray(academicResources.payload) &&
      academicResources.payload.length > 0,
    "学生视角未查询到学术空间资源"
  );

  const adminSession = await login("admin", adminEmail, adminPassword);
  const adminResources = await request(apiBaseUrl, "/admin/resources", {
    accessToken: adminSession.accessToken
  });
  const adminRules = await request(apiBaseUrl, "/admin/rules", {
    accessToken: adminSession.accessToken
  });

  assert(
    Array.isArray(adminResources.payload) && adminResources.payload.length > 0,
    "管理员视角未查询到资源"
  );
  assert(
    Array.isArray(adminRules.payload) && adminRules.payload.length > 0,
    "管理员视角未查询到规则"
  );

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checkedAt: new Date().toISOString(),
        counts: {
          academicResources: academicResources.payload.length,
          adminResources: adminResources.payload.length,
          adminRules: adminRules.payload.length
        }
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[judge-smoke] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
