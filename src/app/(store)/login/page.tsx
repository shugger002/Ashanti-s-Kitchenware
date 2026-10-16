"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { customerLogin } from "@/app/(store)/login/actions";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

function LoginForm() {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(customerLogin, null);
  const next = searchParams.get("next");
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";

  return (
    <div className="mx-auto max-w-md px-4 py-8 lg:px-5 lg:py-16">
      <h1 className="text-3xl md:text-4xl">Sign in</h1>
      <p className="mt-3 text-sm text-muted">
        Optional. You can still check out as a guest. Staff use the{" "}
        <Link href="/admin/login" className="underline">
          administrator sign-in
        </Link>
        .
      </p>
      <form className="mt-8 space-y-4" action={action}>
        <input type="hidden" name="next" value={nextPath} />
        <label className="block text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" defaultValue={state?.email} className="input mt-1" />
        </label>
        <PasswordField name="password" label="Password" required autoComplete="current-password" />
        {state?.error ? <p className="text-sm text-red-800">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="h-12 w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
