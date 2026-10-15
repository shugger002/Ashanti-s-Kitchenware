import { NextResponse } from "next/server";
import { readSessionUser } from "@/server/auth/session";
import { hasPermission } from "@/server/auth/types";
import { runProductCsvImport } from "@/server/catalog/import-file";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await readSessionUser();
  if (!user || !hasPermission(user.roles, "products.write")) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sign in again to import products.",
        created: [],
        skipped: [],
        attached: [],
        unmatched: [],
        errors: [],
      },
      { status: 403 },
    );
  }
  try {
    const formData = await request.formData();
    const result = await runProductCsvImport(formData, user);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not import that file.",
        created: [],
        skipped: [],
        attached: [],
        unmatched: [],
        errors: [],
      },
      { status: 400 },
    );
  }
}
