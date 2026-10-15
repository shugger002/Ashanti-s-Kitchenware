"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/app/(store)/contact/actions";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, null);

  return (
    <form action={action} className="mt-12 space-y-4">
      <h2 className="text-2xl">Write to the shop</h2>
      <label className="block text-sm">
        Name
        <input name="name" required autoComplete="name" className="input mt-1" />
      </label>
      <label className="block text-sm">
        Email
        <input name="email" type="email" required autoComplete="email" className="input mt-1" />
      </label>
      <label className="block text-sm">
        Phone (optional)
        <input name="phone" type="tel" autoComplete="tel" className="input mt-1" />
      </label>
      <label className="block text-sm">
        Message
        <textarea name="message" required rows={5} className="input mt-1" />
      </label>
      <Button type="submit" disabled={pending} className="h-12 w-full sm:w-auto">
        {pending ? "Sending…" : "Send message"}
      </Button>
      {state?.error ? <p className="text-sm text-red-800">{state.error}</p> : null}
      {state?.ok && state.notice ? <p className="text-sm">{state.notice}</p> : null}
    </form>
  );
}
