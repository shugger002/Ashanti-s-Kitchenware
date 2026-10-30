"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmMoolreDebit } from "@/app/(store)/checkout/moolre/confirm";

export function MoolreAwait({ publicRef }: { publicRef: string }) {
  const router = useRouter();
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick(n: number) {
      if (cancelled || n > 40) return;
      const result = await confirmMoolreDebit(publicRef);
      if (cancelled) return;
      if (result.paid) {
        router.refresh();
        return;
      }
      setChecks(n);
      timer = setTimeout(() => void tick(n + 1), 4000);
    }

    timer = setTimeout(() => void tick(1), 2500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [publicRef, router]);

  return (
    <p className="mt-3 text-sm text-muted">
      {checks === 0
        ? "Waiting for Moolre to confirm the debit."
        : "Still waiting for the phone approval. Keep this page open."}
    </p>
  );
}
