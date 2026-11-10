import { NextResponse } from "next/server";
import { readStoreCustomer } from "@/server/customers/session";

export async function GET() {
  const customer = await readStoreCustomer();
  return NextResponse.json(
    { signedIn: Boolean(customer) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
