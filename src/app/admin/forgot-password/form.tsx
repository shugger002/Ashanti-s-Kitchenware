"use client";

import { useState } from "react";
import { submitForgotPassword } from "@/app/admin/forgot-password/actions";
import { Button } from "@/components/ui/button";

export function ForgotForm() {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <p className="mt-6 text-sm text-muted">
        If that email belongs to a staff account, a reset link has been sent.
      </p>
    );
  }
  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await submitForgotPassword(new FormData(event.currentTarget));
        setDone(true);
      }}
    >
      <label className="block text-sm">
        Email
        <input name="email" type="email" required className="input mt-1" />
      </label>
      <Button type="submit">Send reset link</Button>
    </form>
  );
}
