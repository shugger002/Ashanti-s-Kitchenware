import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { ResetForm } from "@/app/admin/reset-password/form";
import { AdminAuthFrame } from "@/components/admin/auth-frame";

export const metadata = pageMeta({
  title: "Set a new password",
  description: "Complete a staff password reset.",
  path: "/admin/reset-password",
});

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AdminAuthFrame title="Set a new password" description="Choose a password of at least 12 characters.">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="mt-8 text-sm text-muted">This reset link is missing a token. Request a new one from sign in.</p>
      )}
      <p className="mt-6 text-sm">
        <Link href="/admin/login" className="text-accent">
          Back to sign in
        </Link>
      </p>
    </AdminAuthFrame>
  );
}
