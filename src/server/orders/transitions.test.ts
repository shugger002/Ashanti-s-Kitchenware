import assert from "node:assert/strict";
import { test } from "node:test";
import { ORDER_TRANSITIONS } from "./service";

test("paid tickets pack or refund, they do not cancel without a refund", () => {
  assert.deepEqual(ORDER_TRANSITIONS.paid, ["packing", "refunded"]);
});

test("a packed paid ticket can still be refunded after the goods come back", () => {
  assert.ok(ORDER_TRANSITIONS.packing.includes("refunded"));
  assert.ok(ORDER_TRANSITIONS.delivered.includes("refunded"));
});
