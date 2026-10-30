"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitMoolreOtp } from "@/app/(store)/checkout/moolre/actions";

export function MoolreOtpForm({ publicRef, momoChannel }: { publicRef: string; momoChannel: "13" | "6" | "7" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await submitMoolreOtp(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.redirectUrl) router.push(result.redirectUrl);
      }}
    >
      <input type="hidden" name="ref" value={publicRef} />
      <input type="hidden" name="momoChannel" value={momoChannel} />
      <label className="block text-sm">
        SMS code
        <input name="otp" required inputMode="numeric" autoComplete="one-time-code" className="input mt-1" />
      </label>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Continue"}
      </Button>
    </form>
  );
}
