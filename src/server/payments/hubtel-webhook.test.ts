import assert from "node:assert/strict";
import { test } from "node:test";
import { HubtelProvider } from "./hubtel";

test("Hubtel callbacks fail closed without a webhook secret", async () => {
  const previous = process.env.HUBTEL_WEBHOOK_SECRET;
  delete process.env.HUBTEL_WEBHOOK_SECRET;
  try {
    await assert.rejects(
      () => new HubtelProvider().parseWebhook(Buffer.from("{}"), new Headers()),
      /HUBTEL_WEBHOOK_SECRET/,
    );
  } finally {
    if (previous == null) delete process.env.HUBTEL_WEBHOOK_SECRET;
    else process.env.HUBTEL_WEBHOOK_SECRET = previous;
  }
});
