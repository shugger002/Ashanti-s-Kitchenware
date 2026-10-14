import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSafeQueryText, escapeLike, likeContains, sql, sqlAnd } from "./sql";

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

test("tagged sql keeps interpolations out of the command text", () => {
  const email = "admin@example.com'; DROP TABLE users; --";
  const q = sql`SELECT id FROM users WHERE lower(email) = ${email}`;
  assert.equal(q.text, "SELECT id FROM users WHERE lower(email) = $1");
  assert.deepEqual(q.values, [email]);
  assert.doesNotThrow(() => assertSafeQueryText(q.text));
});

test("nested fragments remap placeholders and keep values bound", () => {
  const name = "%evil_";
  const status = "paid";
  const where = sqlAnd([sql`full_name ILIKE ${name}`, sql`status = ${status}`]);
  const q = sql`SELECT * FROM orders WHERE ${where}`;
  assert.match(q.text, /\$1/);
  assert.match(q.text, /\$2/);
  assert.equal(q.values.length, 2);
  assert.deepEqual(q.values, [name, status]);
  assert.ok(!q.text.includes("%evil_"));
  assert.ok(!q.text.includes("paid"));
});
