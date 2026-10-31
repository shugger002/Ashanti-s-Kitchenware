import assert from "node:assert/strict";
import { test } from "node:test";
import { ACCOUNT_LOCK_AFTER, isAccountLocked } from "./lockout";

test("account lockout is off when locked_until is missing or past", () => {
  assert.equal(isAccountLocked(null), false);
  assert.equal(isAccountLocked(undefined), false);
  assert.equal(isAccountLocked(new Date(Date.now() - 60_000)), false);
});

test("account lockout is on while locked_until is in the future", () => {
  assert.equal(isAccountLocked(new Date(Date.now() + 60_000)), true);
  assert.equal(isAccountLocked(new Date(Date.now() + 15 * 60_000).toISOString()), true);
});

test("lockout threshold stays a small consecutive-failure count", () => {
  assert.equal(ACCOUNT_LOCK_AFTER, 5);
});
