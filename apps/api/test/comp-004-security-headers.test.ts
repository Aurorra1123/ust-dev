import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";

import {
  createIntegrationHarness,
  type IntegrationHarness
} from "./integration-harness";

describe("COMP-004 security headers", { concurrency: 1 }, () => {
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

  test("health 接口会返回基础安全头", async () => {
    const response = await harness.request("/health");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(
      response.headers.get("referrer-policy"),
      "strict-origin-when-cross-origin"
    );
    assert.equal(
      response.headers.get("permissions-policy"),
      "camera=(), microphone=(), geolocation=(), payment=()"
    );
    assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
    assert.equal(response.headers.get("cross-origin-resource-policy"), "same-site");
  });
});
