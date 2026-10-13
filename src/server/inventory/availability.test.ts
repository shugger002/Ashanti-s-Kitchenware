import assert from "node:assert/strict";
import { test } from "node:test";

function available(onHand: number, reserved: number): number {
  return onHand - reserved;
}

test("available stock never treats reserved units as sellable", () => {
  assert.equal(available(10, 3), 7);
  assert.equal(available(2, 2), 0);
});

test("oversell is detected before decrement", () => {
  const qty = 4;
  const avail = available(5, 2);
  assert.equal(avail < qty, true);
});
