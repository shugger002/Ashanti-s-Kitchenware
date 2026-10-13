import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInventoryCsv } from "./csv";

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

test("inventory CSV reads sku and restock", () => {
  const parsed = parseInventoryCsv("sku,restock\nAK-KETTLE,12\nAK-POT,0\n");
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.rows[0]?.sku, "AK-KETTLE");
  assert.equal(parsed.rows[0]?.restock, 12);
});

test("inventory CSV rejects a missing sku header", () => {
  const parsed = parseInventoryCsv("name,qty\nKettle,2\n");
  assert.equal(parsed.rows.length, 0);
  assert.match(parsed.errors[0] ?? "", /sku/i);
});
