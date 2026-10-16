"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null);
  return (
    <form className="mt-8 space-y-4" action={action}>
      <label className="block text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state?.email}
          className="input mt-1"
        />
      </label>
      <PasswordField name="password" label="Password" required autoComplete="current-password" />
      {state?.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm">
        <a href="/admin/forgot-password">Forgot password</a>
      </p>
    </form>
  );
}
