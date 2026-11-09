import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shopOrderRefFromMoolre } from "./moolre";

describe("shopOrderRefFromMoolre", () => {
  it("leaves the shop order reference unchanged", () => {
    assert.equal(shopOrderRefFromMoolre("AK-20261109-098EC4"), "AK-20261109-098EC4");
  });

  it("strips the Moolre prompt suffix after OTP", () => {
    assert.equal(shopOrderRefFromMoolre("AK-20261109-098EC4.mab12cd"), "AK-20261109-098EC4");
  });
});
