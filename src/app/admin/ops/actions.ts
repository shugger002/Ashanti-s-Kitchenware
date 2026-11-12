"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/server/auth/authorize";
import { confirmAdminPassword } from "@/server/ops/reauth";
import { saveOperationsConfig, getOperationsConfig, parseOperations } from "@/server/ops/settings";
import { retryJob } from "@/server/ops/jobs";
import { writeAuditLog } from "@/server/auth/audit";

export async function saveOperationsAction(formData: FormData) {
  const user = await requirePermission("settings.write");
  const current = await getOperationsConfig();
  const pause = formData.get("checkoutPaused") === "on";
  if (pause !== current.checkoutPaused) {
    const password = String(formData.get("confirmPassword") ?? "");
    if (!(await confirmAdminPassword(user.id, password))) {
      await writeAuditLog({
        actorUserId: user.id,
        action: "ops.checkout.denied",
        entityType: "settings",
        entityId: "operations",
        metadata: { ok: false, reason: "reauth" },
      });
      redirect("/admin/ops?error=" + encodeURIComponent("Enter your admin password to pause or reopen checkout."));
    }
  }
  await saveOperationsConfig(
    parseOperations({
      checkoutPaused: pause,
      maintenanceMessage: String(formData.get("maintenanceMessage") ?? ""),
      reviewsEnabled: formData.get("reviewsEnabled") === "on",
      newsletterEnabled: formData.get("newsletterEnabled") === "on",
      promoPopupEnabled: formData.get("promoPopupEnabled") === "on",
    }),
    user.id,
  );
  redirect("/admin/ops?notice=" + encodeURIComponent("Operations saved."));
}

export async function retryJobAction(formData: FormData) {
  const user = await requirePermission("settings.write");
  const password = String(formData.get("confirmPassword") ?? "");
  if (!(await confirmAdminPassword(user.id, password))) {
    redirect("/admin/ops?error=" + encodeURIComponent("Enter your admin password to retry."));
  }
  const result = await retryJob(String(formData.get("jobId") ?? ""), user.id);
  revalidatePath("/admin/ops");
  revalidatePath("/admin/services");
  if (result.ok) {
    redirect("/admin/ops?notice=" + encodeURIComponent(result.message));
  }
  redirect("/admin/ops?error=" + encodeURIComponent(result.message));
}
