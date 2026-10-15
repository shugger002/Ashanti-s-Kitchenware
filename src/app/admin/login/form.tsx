"use client";

import { useState } from "react";
import { adminLogin } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await adminLogin(new FormData(event.currentTarget));
        if (!result.ok) {
          setPending(false);
          setError(result.error);
          return;
        }
        window.location.assign("/admin");
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
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Log In"}
      </Button>
      <p className="text-sm">
        <a href="/admin/forgot-password">Forgot password</a>
      </p>
    </form>
  );
}
