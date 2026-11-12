import assert from "node:assert/strict";
import test from "node:test";
import { secretsEqual, sniffImageType } from "./secrets";

test("secretsEqual rejects empty and mismatched lengths", () => {
  assert.equal(secretsEqual("", "abc"), false);
  assert.equal(secretsEqual("ab", "abc"), false);
  assert.equal(secretsEqual("abc", "abc"), true);
  assert.equal(secretsEqual("abc", "abd"), false);
});

test("sniffImageType reads magic bytes, not filenames", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const html = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
  assert.equal(sniffImageType(jpeg), "image/jpeg");
  assert.equal(sniffImageType(png), "image/png");
  assert.equal(sniffImageType(html), null);
});
