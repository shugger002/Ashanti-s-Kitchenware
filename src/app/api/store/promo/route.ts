import { NextResponse } from "next/server";
import { searchProducts } from "@/server/catalog/queries";
import { getOperationsConfig } from "@/server/ops/settings";

export async function GET() {
  const ops = await getOperationsConfig();
  if (!ops.promoPopupEnabled || ops.checkoutPaused) {
    return NextResponse.json({ items: [] });
  }
  const { items } = await searchProducts({ onSale: true, pageSize: 8 });
  return NextResponse.json({ items });
}
