"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendEmail } from "@/server/notifications/email";
import { getStorefrontConfig } from "@/server/store/settings";
import { hitRateLimit } from "@/server/auth/rate-limit";
import { clientIp } from "@/server/http/client-ip";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10).max(2000),
});

export async function sendContactMessage(
  _prev: { ok: boolean; error?: string; notice?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; notice?: string }> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please complete your name, email, and a short message." };
  }
  const ip = clientIp(await headers());
  if (await hitRateLimit(`contact:${parsed.data.email.toLowerCase()}`, 8, ip)) {
    return { ok: false, error: "Too many messages from this address. Try again later." };
  }
  if (ip && (await hitRateLimit(`contact-ip:${ip}`, 12, ip))) {
    return { ok: false, error: "Too many messages. Try again later." };
  }

  const { contact } = await getStorefrontConfig();
  const body = [
    `Name: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    parsed.data.phone ? `Phone: ${parsed.data.phone}` : null,
    "",
    parsed.data.message,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendEmail({
    to: contact.email,
    subject: `Website enquiry from ${parsed.data.name}`,
    text: body,
  });

  if (!result.sent) {
    return {
      ok: true,
      notice: `The form could not email the shop automatically (${result.reason ?? "mail not configured"}). Write to ${contact.email} or call ${contact.phoneDisplay}.`,
    };
  }

  return { ok: true, notice: "Your message was sent. We will reply from the shop email." };
}
