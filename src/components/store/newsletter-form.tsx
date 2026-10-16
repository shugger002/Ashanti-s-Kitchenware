"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeKitchenNotes } from "@/app/(store)/journal/actions";

export function NewsletterForm({ compact = false, invert = false }: { compact?: boolean; invert?: boolean }) {
  const [state, action, pending] = useActionState(subscribeKitchenNotes, null);
  return (
    <form
      action={action}
      className={
        compact
          ? "space-y-2 lg:space-y-3"
          : invert
            ? "mt-6 flex flex-col gap-3"
            : "mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
      }
    >
      <label htmlFor={compact ? "footer-email" : "journal-email"} className="sr-only">
        Email
      </label>
      {compact ? (
        <div className="flex gap-2">
          <input
            id="footer-email"
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="input min-w-0 flex-1"
          />
          <Button type="submit" disabled={pending} className="shrink-0 px-4">
            {pending ? "Sending…" : "Subscribe"}
          </Button>
        </div>
      ) : (
        <input
          id="journal-email"
          name="email"
          type="email"
          required
          placeholder="Email address"
          className={invert ? "input bg-white text-foreground placeholder:text-muted" : "input"}
        />
      )}
      <label className={`flex gap-2 text-xs leading-relaxed ${invert ? "text-white" : "text-muted"}`}>
        <input type="checkbox" name="consent" required className={`mt-0.5 ${invert ? "accent-white" : "accent-accent"}`} />
        I want stock updates. This is not a discount unless the shop later publishes one.
      </label>
      {compact ? null : (
        <Button
          type="submit"
          variant={invert ? "secondary" : "primary"}
          className={invert ? "h-12 w-full bg-white text-accent hover:bg-white/90" : "h-12 w-full sm:w-auto"}
          disabled={pending}
        >
          {pending ? "Sending…" : "Subscribe"}
        </Button>
      )}
      {state?.error ? (
        <p className={`text-sm sm:col-span-2 ${invert ? "text-white" : "text-accent"}`}>{state.error}</p>
      ) : null}
      {state?.notice ? (
        <p className={`text-sm sm:col-span-2 ${invert ? "text-white/90" : "text-muted"}`}>{state.notice}</p>
      ) : null}
    </form>
  );
}
