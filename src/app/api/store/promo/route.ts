import { NextResponse } from "next/server";
import { searchProducts } from "@/server/catalog/queries";

export async function GET() {
  const { items } = await searchProducts({ onSale: true, pageSize: 8 });
  return NextResponse.json({ items });
}
