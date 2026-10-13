"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeKitchenNotes } from "@/app/(store)/journal/actions";

export function NewsletterForm({ compact = false, invert = false }: { compact?: boolean; invert?: boolean }) {
  const [state, action, pending] = useActionState(subscribeKitchenNotes, null);
  return (
    <form
      action={action}
      className={compact ? "space-y-2" : invert ? "mt-6 flex flex-col gap-3" : "mt-6 flex max-w-md flex-col gap-3 sm:flex-row"}
    >
      <label htmlFor={compact ? "footer-email" : "journal-email"} className="sr-only">
        Email
      </label>
      <input
        id={compact ? "footer-email" : "journal-email"}
        name="email"
        type="email"
        required
        placeholder="Email address"
        className={invert ? "input bg-white text-foreground placeholder:text-muted" : "input"}
      />
      <label className={`flex gap-2 text-xs leading-relaxed ${invert ? "text-white" : "text-muted"}`}>
        <input type="checkbox" name="consent" required className="mt-0.5 accent-white" />
        I want kitchen notes. This is not a discount unless the shop later publishes one.
      </label>
      <Button
        type="submit"
        variant={invert ? "secondary" : "primary"}
        className={invert ? "bg-white text-accent hover:bg-white/90" : undefined}
        disabled={pending}
      >
        {pending ? "Sending…" : "Subscribe"}
      </Button>
      {state?.error ? (
        <p className={`text-sm sm:col-span-2 ${invert ? "text-white" : "text-accent"}`}>{state.error}</p>
      ) : null}
      {state?.notice ? (
        <p className={`text-sm sm:col-span-2 ${invert ? "text-white/90" : "text-muted"}`}>{state.notice}</p>
      ) : null}
    </form>
  );
}
