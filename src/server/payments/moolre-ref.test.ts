import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { moolreChannelName, moolreCollectionState, shopOrderRefFromMoolre } from "./moolre";

describe("shopOrderRefFromMoolre", () => {
  it("leaves the shop order reference unchanged", () => {
    assert.equal(shopOrderRefFromMoolre("AK-20261109-098EC4"), "AK-20261109-098EC4");
  });

  it("strips the Moolre prompt suffix after OTP", () => {
    assert.equal(shopOrderRefFromMoolre("AK-20261109-098EC4.mab12cd"), "AK-20261109-098EC4");
  });
});

describe("moolreChannelName", () => {
  it("sends the network name Moolre documents", () => {
    assert.equal(moolreChannelName("13"), "MTN");
    assert.equal(moolreChannelName("6"), "TELECEL");
    assert.equal(moolreChannelName("7"), "AT");
    assert.equal(moolreChannelName(undefined), "MTN");
  });
});

describe("moolreCollectionState", () => {
  it("treats SS01 with txstatus 1 as paid", () => {
    assert.equal(moolreCollectionState("SS01", 1), "paid");
  });

  it("keeps an in-progress prompt pending", () => {
    assert.equal(moolreCollectionState("SS01", 0), "pending");
  });

  it("treats txstatus 2 as declined", () => {
    assert.equal(moolreCollectionState("SS01", 2), "failed");
  });

  it("does not call a payment paid without SS01", () => {
    assert.equal(moolreCollectionState("TP18", 1), "unknown");
  });
});
