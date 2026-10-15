import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProductCsv } from "./csv";

test("reads Price (GHS) headers from a sheet PDF dump", () => {
  const parsed = parseProductCsv(`Untitled spreadsheet
Product Name,SKU Code,Price (GHS)
Stainless kettle,AK-KETTLE-01,1599
`);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]?.sku, "AK-KETTLE-01");
  assert.equal(parsed.rows[0]?.price, 1599);
});

test("reads stacked name sku price cells", () => {
  const parsed = parseProductCsv(`Untitled spreadsheet
Name
SKU
Price
Stainless kettle
AK-KETTLE-01
1599
`);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]?.name, "Stainless kettle");
  assert.equal(parsed.rows[0]?.sku, "AK-KETTLE-01");
});

test("infers columns without english headers", () => {
  const parsed = parseProductCsv(`Stainless kettle,AK-KETTLE-01,1599
Cast iron pot,AK-POT-02,890
`);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[1]?.sku, "AK-POT-02");
});
