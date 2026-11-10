"use client";

import { buttonClass } from "@/components/ui/button";

export function PrintTicketButton({ label = "Print ticket" }: { label?: string }) {
  return (
    <button type="button" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")} onClick={() => window.print()}>
      {label}
    </button>
  );
}
