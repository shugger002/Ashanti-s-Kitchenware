import assert from "node:assert/strict";
import test from "node:test";
import { hasPermission, isDeveloper, normalizeAdminRoles } from "@/server/auth/types";

test("only the developer role can open operations", () => {
  assert.equal(hasPermission(["developer"], "ops.write"), true);
  assert.equal(hasPermission(["super_admin"], "ops.write"), false);
  assert.equal(hasPermission(["store_admin"], "ops.write"), false);
  assert.equal(hasPermission(["super_admin", "developer"], "ops.write"), true);
});

test("developer can run the shop from the phone desk", () => {
  assert.equal(hasPermission(["developer"], "orders.read"), true);
  assert.equal(hasPermission(["developer"], "products.write"), true);
  assert.equal(hasPermission(["developer"], "inventory.write"), true);
  assert.equal(hasPermission(["developer"], "settings.write"), true);
  assert.equal(hasPermission(["developer"], "users.write"), true);
  assert.equal(hasPermission(["developer"], "payments.capture"), true);
  assert.equal(hasPermission(["store_admin"], "ops.write"), false);
});

test("normalizeAdminRoles keeps developer from a postgres array", () => {
  assert.deepEqual(normalizeAdminRoles(["developer"]), ["developer"]);
  assert.deepEqual(normalizeAdminRoles("{developer}"), ["developer"]);
  assert.deepEqual(normalizeAdminRoles(["{developer}"]), ["developer"]);
  assert.deepEqual(normalizeAdminRoles("developer"), ["developer"]);
  assert.equal(hasPermission("{developer}", "ops.write"), true);
  assert.equal(isDeveloper(["developer"]), true);
});
