"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitMoolreOtp } from "@/app/(store)/checkout/moolre/actions";

export function MoolreOtpForm({ publicRef }: { publicRef: string }) {
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
      <label className="block text-sm">
        SMS code
        <input name="otp" required inputMode="numeric" autoComplete="one-time-code" className="input mt-1" />
      </label>
      <fieldset className="space-y-2 text-sm">
        <legend className="font-medium">Network</legend>
        <label className="flex gap-2">
          <input type="radio" name="momoChannel" value="13" defaultChecked />
          MTN
        </label>
        <label className="flex gap-2">
          <input type="radio" name="momoChannel" value="6" />
          Telecel
        </label>
        <label className="flex gap-2">
          <input type="radio" name="momoChannel" value="7" />
          AT
        </label>
      </fieldset>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Continue"}
      </Button>
    </form>
  );
}
