import { revalidatePath, revalidateTag } from "next/cache";
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
  const replacePrimary = form.get("replacePrimary") === "on";
  const isPrimary = replacePrimary || form.get("isPrimary") === "on";
  if (!(file instanceof File) || !productId) {
    return NextResponse.json({ ok: false, error: "Choose a photo first." }, { status: 400 });
  }
  try {
    await saveProductPhoto({ productId, file, alt, isPrimary, replacePrimary });
    revalidateTag("catalog", { expire: 0 });
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/shop", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const message =
      code === "23505"
        ? "The main photo was just updated. Refresh and try again."
        : code === "23514"
          ? "Save the photo as a normal JPEG, PNG, or WebP."
          : error instanceof Error
            ? error.message
            : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
