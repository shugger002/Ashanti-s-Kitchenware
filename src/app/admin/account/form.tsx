"use client";

import { useActionState } from "react";
import { changeAccountPassword } from "@/app/admin/account/actions";
import { adminButton, AdminSection } from "@/components/admin/ui";
import { PasswordField } from "@/components/ui/password-field";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeAccountPassword, null);
  return (
    <form action={action} className="max-w-xl">
      <AdminSection title="Change password" hint="At least 12 characters. This phone stays signed in. Other devices must sign in again.">
        <PasswordField name="currentPassword" label="Current password" required autoComplete="current-password" />
        <div className="mt-4">
          <PasswordField name="nextPassword" label="New password" required autoComplete="new-password" />
        </div>
        {state?.error ? (
          <p className="mt-4 text-sm text-accent" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.notice ? (
          <p className="mt-4 text-sm" role="status">
            {state.notice}
          </p>
        ) : null}
        <button className={`${adminButton()} mt-5`} type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </button>
      </AdminSection>
    </form>
  );
}
