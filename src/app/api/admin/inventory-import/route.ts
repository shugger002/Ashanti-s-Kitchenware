import { NextResponse } from "next/server";
import { readSessionUser } from "@/server/auth/session";
import { hasPermission } from "@/server/auth/types";
import { runInventoryCsvImport } from "@/server/inventory/import-file";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await readSessionUser();
  if (!user || !hasPermission(user.roles, "inventory.write")) {
    return NextResponse.json(
      { ok: false, message: "Sign in again to update inventory.", updated: [], skipped: [], errors: [] },
      { status: 403 },
    );
  }
  try {
    const formData = await request.formData();
    const result = await runInventoryCsvImport(formData, user);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not import that file.",
        updated: [],
        skipped: [],
        errors: [],
      },
      { status: 400 },
    );
  }
}
