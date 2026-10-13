"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await adminLogin(new FormData(event.currentTarget));
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push("/admin");
      }}
    >
      <label className="block text-sm">
        Email
        <input name="email" type="email" required className="input mt-1" />
      </label>
      <label className="block text-sm">
        Password
        <input name="password" type="password" required className="input mt-1" />
      </label>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <Button type="submit">Sign in</Button>
      <p className="text-sm">
        <a href="/admin/forgot-password">Forgot password</a>
      </p>
    </form>
  );
}
