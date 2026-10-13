import { pageMeta } from "@/lib/seo";
import { AdminLoginForm } from "@/app/admin/login/form";
import { AdminAuthFrame } from "@/components/admin/auth-frame";

export const metadata = pageMeta({
  title: "Staff sign in",
  description: "Administrator sign in for Ashanti's Kitchenware.",
  path: "/admin/login",
});

export default function AdminLoginPage() {
  return (
    <AdminAuthFrame title="Staff sign in" description="This area is for store staff only.">
      <AdminLoginForm />
    </AdminAuthFrame>
  );
}
