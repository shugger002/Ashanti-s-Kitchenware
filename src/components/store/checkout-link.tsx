"use client";

import Link, { useLinkStatus } from "next/link";
import { buttonClass } from "@/components/ui/button";

function CheckoutLinkText({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return pending ? "Opening checkout…" : label;
}

export function CheckoutLink({ label, className }: { label: string; className?: string }) {
  return (
    <Link href="/checkout" className={buttonClass("primary", className)} aria-live="polite">
      <CheckoutLinkText label={label} />
    </Link>
  );
}
