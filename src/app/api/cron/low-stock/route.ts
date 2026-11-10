import { NextResponse } from "next/server";
import { sendLowStockDigest } from "@/server/notifications/low-stock";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await sendLowStockDigest();
  return NextResponse.json({ ok: true, ...result });
}
