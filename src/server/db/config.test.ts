import assert from "node:assert/strict";
import { test } from "node:test";
import { databaseUrlForPool } from "./config";

const session =
  "postgres://postgres.example:secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require";

test("runtime checkout uses the transaction pooler port", () => {
  assert.equal(
    databaseUrlForPool(session, "runtime"),
    "postgres://postgres.example:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  );
});

test("migrations keep the session pooler port", () => {
  assert.equal(
    databaseUrlForPool(session, "migrate"),
    "postgres://postgres.example:secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
  );
});

test("a transaction pooler URL is left on port 6543", () => {
  const transaction = session.replace(":5432", ":6543");
  assert.match(databaseUrlForPool(transaction, "runtime"), /:6543\/postgres$/);
});

test("local postgres is not rewritten", () => {
  const local = "postgres://ashantisa:changeme@127.0.0.1:5432/ashantisa";
  assert.equal(databaseUrlForPool(local, "runtime"), local);
});
