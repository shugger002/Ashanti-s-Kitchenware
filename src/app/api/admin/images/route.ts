import { NextResponse } from "next/server";
import { readSessionUser } from "@/server/auth/session";
import { hasPermission } from "@/server/auth/types";
import { addProductImage } from "@/server/catalog/admin";
import { assertImageUpload, extensionForType, getStorage, randomObjectKey } from "@/server/storage";

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
    assertImageUpload({ type: file.type, size: file.size });
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await getStorage().put({
      bytes,
      contentType: file.type,
      key: randomObjectKey(extensionForType(file.type)),
    });
    await addProductImage({
      productId,
      url: stored.url,
      storageKey: stored.key,
      alt,
      isPrimary,
    });
    return NextResponse.json({ ok: true, url: stored.url });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
