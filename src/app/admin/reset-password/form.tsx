"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitNewPassword } from "@/app/admin/reset-password/actions";
import { Button } from "@/components/ui/button";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await submitNewPassword(new FormData(event.currentTarget));
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push("/admin/login");
      }}
    >
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm">
        New password
        <input name="password" type="password" required minLength={12} className="input mt-1" />
      </label>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <Button type="submit" className="h-12 w-full">
        Update password
      </Button>
    </form>
  );
}
