"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitMoolreOtp } from "@/app/(store)/checkout/moolre/actions";
import { shopperError } from "@/lib/user-error";

const NETWORK: Record<"13" | "6" | "7", string> = {
  "13": "MTN",
  "6": "Telecel",
  "7": "AT",
};

export function MoolreOtpForm({
  publicRef,
  momoChannel,
}: {
  publicRef: string;
  momoChannel: "13" | "6" | "7";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [otp, setOtp] = useState("");

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        setError(null);
        try {
          const result = await submitMoolreOtp(new FormData(event.currentTarget));
          if (!result.ok) {
            setError(shopperError(result.error, "Could not check that code. Try again."));
            return;
          }
          if (result.redirectUrl) router.push(result.redirectUrl);
        } catch (error) {
          setError(shopperError(error, "Could not check that code. Check your connection and try again."));
        } finally {
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="ref" value={publicRef} />
      <input type="hidden" name="momoChannel" value={momoChannel} />
      <p className="text-sm text-muted">
        Order <span className="font-medium text-foreground">{publicRef}</span>
        {" · "}
        {NETWORK[momoChannel]}
      </p>
      <label className="block text-sm">
        SMS code
        <input
          name="otp"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="input mt-1"
        />
      </label>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <Button type="submit" className="h-12 w-full sm:w-auto" disabled={pending || otp.length !== 6}>
        {pending ? "Sending…" : "Send the prompt"}
      </Button>
    </form>
  );
}
