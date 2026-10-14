import { NextResponse } from "next/server";
import { readSessionUser } from "@/server/auth/session";
import { hasPermission } from "@/server/auth/types";
import { saveProductPhoto } from "@/server/catalog/images";

export async function POST(request: Request) {
  const user = await readSessionUser();
  if (!user || !hasPermission(user.roles, "products.write")) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get("file");
  const productId = String(form.get("productId") ?? "");
  const alt = String(form.get("alt") ?? "");
  const isPrimary = form.get("isPrimary") === "on";
  if (!(file instanceof File) || !productId) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }
  try {
    await saveProductPhoto({ productId, file, alt, isPrimary });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
