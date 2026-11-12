import { NextResponse } from "next/server";
import { getOperationsConfig } from "@/server/ops/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const ops = await getOperationsConfig();
  return NextResponse.json({
    checkoutPaused: ops.checkoutPaused,
    maintenanceMessage: ops.checkoutPaused ? ops.maintenanceMessage : "",
    promoPopupEnabled: ops.promoPopupEnabled && !ops.checkoutPaused,
  });
}
