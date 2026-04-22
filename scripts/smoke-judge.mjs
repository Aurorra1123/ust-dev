#!/usr/bin/env node

import { runSmokeSuite } from "./smoke-suite.mjs";

const webBaseUrl = process.env.SMOKE_WEB_BASE_URL ?? "http://nginx";
const apiBaseUrl = process.env.SMOKE_API_BASE_URL ?? "http://nginx/api";

const studentEmail = process.env.SMOKE_STUDENT_EMAIL ?? "demo@campusbook.top";
const studentPassword = process.env.SMOKE_STUDENT_PASSWORD ?? "demo123456";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@campusbook.top";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "admin123456";

runSmokeSuite({
  label: "judge-smoke",
  webBaseUrl,
  apiBaseUrl,
  expectedRefreshCookiePath: "/api/auth",
  studentEmail,
  studentPassword,
  adminEmail,
  adminPassword
}).catch((error) => {
  console.error("[judge-smoke] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
