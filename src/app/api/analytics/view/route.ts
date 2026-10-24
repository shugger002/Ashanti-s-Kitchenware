import { NextResponse } from "next/server";
import { z } from "zod";
import { recordStorePageView } from "@/server/analytics/page-views";
import { hitRateLimit } from "@/server/auth/rate-limit";
import { clientIp } from "@/server/http/client-ip";

const schema = z.object({
  path: z.string().min(1).max(180),
  referrer: z.string().max(400).optional().nullable(),
});

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  if (await hitRateLimit(`analytics-view:${ip ?? "unknown"}`, 60, ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await recordStorePageView({
    path: parsed.data.path,
    referrer: parsed.data.referrer ?? null,
    ip,
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ ok: true });
}
