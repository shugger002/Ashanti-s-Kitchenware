"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { customerLogin } from "@/app/(store)/login/actions";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
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
      <form
        className="mt-8 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await customerLogin(new FormData(event.currentTarget));
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(nextPath);
          router.refresh();
        }}
      >
        <label className="block text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="input mt-1" />
        </label>
        {error ? <p className="text-sm text-red-800">{error}</p> : null}
        <Button type="submit" className="h-12 w-full">Sign in</Button>
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
