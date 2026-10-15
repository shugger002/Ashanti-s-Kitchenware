"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { customerRegister } from "@/app/(store)/login/actions";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-md px-4 py-8 lg:px-5 lg:py-16">
      <h1 className="text-3xl md:text-4xl">Create an account</h1>
      <p className="mt-3 text-sm text-muted">Saved orders stay on this account. Guest checkout remains available.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await customerRegister(new FormData(event.currentTarget));
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push("/account");
          router.refresh();
        }}
      >
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
        <label className="block text-sm">
          Password
          <input name="password" type="password" required minLength={10} autoComplete="new-password" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Confirm password
          <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className="input mt-1" />
        </label>
        {error ? <p className="text-sm text-red-800">{error}</p> : null}
        <Button type="submit" className="h-12 w-full">Create account</Button>
      </form>
      <p className="mt-6 text-sm">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
