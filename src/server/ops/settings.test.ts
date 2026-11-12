import assert from "node:assert/strict";
import test from "node:test";
import { parseOperations, DEFAULT_OPERATIONS } from "@/server/ops/settings";
import { redactMetadata } from "@/server/ops/audit";

test("parseOperations uses safe defaults", () => {
  assert.deepEqual(parseOperations(null).reviewsEnabled, true);
  assert.equal(parseOperations({ checkoutPaused: true }).checkoutPaused, true);
  assert.equal(parseOperations({ checkoutPaused: "yes" }).checkoutPaused, false);
  assert.equal(parseOperations({ maintenanceMessage: "   " }).maintenanceMessage, DEFAULT_OPERATIONS.maintenanceMessage);
  assert.equal(parseOperations({ reviewsEnabled: false }).reviewsEnabled, false);
});

test("redactMetadata strips secrets and keeps booleans", () => {
  const out = redactMetadata({
    checkoutPaused: true,
    webhookSecret: "abc",
    token: "xyz",
    ok: false,
    nested: { password: "no" },
  });
  assert.equal(out.checkoutPaused, true);
  assert.equal(out.webhookSecret, "[redacted]");
  assert.equal(out.token, "[redacted]");
  assert.equal(out.ok, false);
  assert.equal(out.nested, "[omitted]");
});
