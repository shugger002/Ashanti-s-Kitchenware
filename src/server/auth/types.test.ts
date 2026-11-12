import assert from "node:assert/strict";
import test from "node:test";
import { hasPermission } from "@/server/auth/types";

test("only the developer role can open operations", () => {
  assert.equal(hasPermission(["developer"], "ops.write"), true);
  assert.equal(hasPermission(["super_admin"], "ops.write"), false);
  assert.equal(hasPermission(["store_admin"], "ops.write"), false);
  assert.equal(hasPermission(["super_admin", "developer"], "ops.write"), true);
});

test("developer does not get the shop desk by default", () => {
  assert.equal(hasPermission(["developer"], "orders.read"), false);
  assert.equal(hasPermission(["developer"], "settings.write"), false);
  assert.equal(hasPermission(["developer"], "users.write"), false);
});
