import { NextResponse } from "next/server";
import { secretsEqual } from "@/lib/secrets";
import { pruneGrowthTables } from "@/server/ops/prune";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";
  if (!secret || !secretsEqual(auth, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const pruned = await pruneGrowthTables();
  return NextResponse.json({ ok: true, pruned });
}
