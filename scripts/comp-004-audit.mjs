#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const checks = [
  {
    id: "a11y-global-focus",
    file: "apps/web/src/styles.css",
    includes: [".skip-link", ".sr-only", "focus-visible"]
  },
  {
    id: "a11y-skip-link",
    file: "apps/web/src/ui/app-shell.tsx",
    includes: ['href="#main-content"', 'Primary navigation', 'aria-pressed={locale === "zh-CN"}']
  },
  {
    id: "a11y-state-panel-live-region",
    file: "apps/web/src/ui/user-experience-kit.tsx",
    includes: ['role={role}', 'aria-live={ariaLive}']
  },
  {
    id: "a11y-spaces-keyboard-help",
    file: "apps/web/src/ui/pages/spaces/spaces-booking-panel.tsx",
    includes: ["spaces-booking-time-help", "aria-describedby", "spaces-companion-help"]
  },
  {
    id: "a11y-sports-keyboard-help",
    file: "apps/web/src/ui/pages/sports/sports-booking-panel.tsx",
    includes: ["sports-target-help", "aria-pressed", "移除已选时段"]
  },
  {
    id: "a11y-activities-explicit-status",
    file: "apps/web/src/ui/pages/activities-page.tsx",
    includes: ["ticket-availability-", "当前查看", "该票种已满"]
  },
  {
    id: "security-web-proxy-headers",
    file: "infra/nginx/conf.d/campusbook.conf",
    includes: [
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy"
    ]
  },
  {
    id: "security-web-container-headers",
    file: "infra/docker/web-default.conf",
    includes: [
      "Content-Security-Policy",
      "Cross-Origin-Opener-Policy",
      "Cross-Origin-Resource-Policy"
    ]
  },
  {
    id: "security-api-baseline-headers",
    file: "apps/api/src/bootstrap-api.ts",
    includes: [
      "\"X-Content-Type-Options\"",
      "\"X-Frame-Options\"",
      "\"Referrer-Policy\"",
      "\"Permissions-Policy\""
    ]
  }
];

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function auditSourceChecks() {
  return checks.map((check) => {
    const content = read(check.file);
    const missing = check.includes.filter((token) => !content.includes(token));

    return {
      id: check.id,
      file: check.file,
      ok: missing.length === 0,
      missing
    };
  });
}

function auditBuildArtifacts() {
  const distRoot = join(process.cwd(), "apps/web/dist");
  const assetsRoot = join(distRoot, "assets");
  const htmlPath = join(distRoot, "index.html");
  const htmlSizeBytes = statSync(htmlPath).size;
  const assetFiles = readdirSync(assetsRoot);
  const jsEntry = assetFiles.find((file) => file.startsWith("index-") && file.endsWith(".js"));
  const cssEntry = assetFiles.find((file) => file.startsWith("index-") && file.endsWith(".css"));
  const jsFile = jsEntry ? join(assetsRoot, jsEntry) : null;
  const cssFile = cssEntry ? join(assetsRoot, cssEntry) : null;

  return {
    htmlSizeBytes,
    jsSizeBytes: jsFile ? statSync(jsFile).size : null,
    cssSizeBytes: cssFile ? statSync(cssFile).size : null
  };
}

try {
  const sourceChecks = auditSourceChecks();
  const buildArtifacts = auditBuildArtifacts();
  const failedChecks = sourceChecks.filter((check) => !check.ok);

  const summary = {
    status: failedChecks.length === 0 ? "ok" : "failed",
    checkedAt: new Date().toISOString(),
    sourceChecks,
    buildArtifacts
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failedChecks.length > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
}
