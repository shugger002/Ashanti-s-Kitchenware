import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ghanaLocalMsisdn, inferMomoChannel } from "./phone-gh";

describe("inferMomoChannel", () => {
  it("maps MTN prefixes including +233", () => {
    assert.equal(inferMomoChannel("+233543111607"), "13");
    assert.equal(inferMomoChannel("0244111607"), "13");
  });

  it("maps Telecel and AT", () => {
    assert.equal(inferMomoChannel("0201944235"), "6");
    assert.equal(inferMomoChannel("0271234567"), "7");
  });

  it("returns null when the prefix is unknown", () => {
    assert.equal(inferMomoChannel("0302123456"), null);
  });
});

describe("ghanaLocalMsisdn", () => {
  it("normalises international Ghana numbers for Moolre", () => {
    assert.equal(ghanaLocalMsisdn("+233543111607"), "0543111607");
  });
});
