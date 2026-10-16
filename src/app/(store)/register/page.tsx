"use client";

import Link from "next/link";
import { useActionState } from "react";
import { customerRegister } from "@/app/(store)/login/actions";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(customerRegister, null);
  return (
    <div className="mx-auto max-w-md px-4 py-8 lg:px-5 lg:py-16">
      <h1 className="text-3xl md:text-4xl">Create an account</h1>
      <p className="mt-3 text-sm text-muted">Saved orders stay on this account. Guest checkout remains available.</p>
      <form className="mt-8 space-y-4" action={action}>
        <label className="block text-sm">
          Full name
          <input name="fullName" required autoComplete="name" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Phone
          <input name="phone" type="tel" required autoComplete="tel" className="input mt-1" />
        </label>
        <PasswordField name="password" label="Password" required minLength={10} autoComplete="new-password" />
        <PasswordField name="confirm" label="Confirm password" required minLength={10} autoComplete="new-password" />
        {state?.error ? <p className="text-sm text-red-800">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="h-12 w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
