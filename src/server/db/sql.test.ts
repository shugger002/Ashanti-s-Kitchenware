import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSafeQueryText, escapeLike, likeContains } from "./sql";

test("login-style payloads stay data, not SQL", () => {
  assert.equal(escapeLike("' OR 1=1 --"), "' OR 1=1 --");
  assert.equal(likeContains("' OR 1=1 --"), "%' OR 1=1 --%");
  assert.equal(escapeLike("100%_off\\x"), "100\\%\\_off\\\\x");
});

test("stacked mutation SQL is refused", () => {
  assert.throws(() => assertSafeQueryText("SELECT 1; DROP TABLE users"));
  assert.throws(() => assertSafeQueryText("SELECT 1; DELETE FROM sessions"));
  assert.doesNotThrow(() =>
    assertSafeQueryText("SELECT id FROM users WHERE lower(email) = $1"),
  );
});
