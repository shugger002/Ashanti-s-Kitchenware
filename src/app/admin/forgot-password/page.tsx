import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { isPasswordResetEnabled } from "@/server/auth/password-reset";
import { ForgotForm } from "@/app/admin/forgot-password/form";
import { AdminAuthFrame } from "@/components/admin/auth-frame";

export const metadata = pageMeta({
  title: "Reset password",
  description: "Request a staff password reset.",
  path: "/admin/forgot-password",
});

export default function ForgotPasswordPage() {
  const enabled = isPasswordResetEnabled();
  return (
    <AdminAuthFrame title="Reset password" description="We will email a link only if this address belongs to staff.">
      {enabled ? (
        <ForgotForm />
      ) : (
        <p className="mt-8 text-sm leading-relaxed text-muted">
          Password reset is unavailable until an SMTP service is configured.
        </p>
      )}
      <p className="mt-6 text-sm">
        <Link href="/admin/login" className="text-accent">
          Back to sign in
        </Link>
      </p>
    </AdminAuthFrame>
  );
}
