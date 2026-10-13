"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendEmail } from "@/server/notifications/email";
import { getStorefrontConfig } from "@/server/store/settings";
import { hitRateLimit } from "@/server/auth/rate-limit";
import { clientIp } from "@/server/http/client-ip";

const schema = z.object({
  email: z.string().trim().email().max(160),
});

export async function subscribeKitchenNotes(
  _prev: { ok: boolean; error?: string; notice?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; notice?: string }> {
  if (formData.get("consent") !== "on" && formData.get("consent") !== "true") {
    return { ok: false, error: "Tick the box if you want kitchen notes." };
  }
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const ip = clientIp(await headers());
  if (await hitRateLimit(`notes:${parsed.data.email.toLowerCase()}`, 5, ip)) {
    return { ok: false, error: "Too many signups from this address. Try again later." };
  }
  if (ip && (await hitRateLimit(`notes-ip:${ip}`, 8, ip))) {
    return { ok: false, error: "Too many signups. Try again later." };
  }
  const { contact } = await getStorefrontConfig();
  const result = await sendEmail({
    to: contact.email,
    subject: `Kitchen notes signup: ${parsed.data.email}`,
    text: `${parsed.data.email} asked to receive kitchen notes. No discount is attached until the shop publishes one.`,
  });
  if (!result.sent) {
    return {
      ok: false,
      error: `Kitchen notes could not be sent automatically (${result.reason ?? "mail not configured"}). Email ${contact.email} if you still want to subscribe.`,
    };
  }
  return { ok: true, notice: "Thank you. The shop will send kitchen notes from this address when the list is live." };
}
