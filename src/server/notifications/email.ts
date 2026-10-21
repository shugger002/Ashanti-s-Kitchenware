import { createTransport } from "nodemailer";

function headerLine(value: string) {
  return value.replace(/[\r\n\0]+/g, " ").trim();
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function defaultFromAddress() {
  return (
    process.env.SMTP_FROM?.trim() ||
    "Ashanti's Kitchenware <support@ashantiskitchenware.com>"
  );
}

export function isMailConfigured() {
  if (process.env.RESEND_API_KEY?.trim()) return true;
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

function brandedHtml(body: string) {
  return `<!doctype html>
<html>
<body style="margin:0;background:#f6f3ee;padding:24px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e0d6;">
    <p style="margin:0;padding:14px 20px;background:#c8102e;color:#fff;font-size:16px;">Ashanti's Kitchenware</p>
    <div style="padding:20px;font-size:16px;line-height:1.5;">${body}</div>
    <p style="margin:0;padding:14px 20px;border-top:1px solid #e8e0d6;font-size:13px;color:#5c5348;">108 Dansoman-Sakaman, Accra · +233 20 194 4235</p>
  </div>
</body>
</html>`;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!isMailConfigured()) {
    return { sent: false, reason: "SMTP is not configured" };
  }

  const from = headerLine(defaultFromAddress());
  const to = headerLine(input.to);
  const subject = headerLine(input.subject);
  const replyTo = input.replyTo ? headerLine(input.replyTo) : undefined;
  const html = input.html ?? brandedHtml(`<p style="white-space:pre-wrap;margin:0;">${escapeHtml(input.text)}</p>`);

  try {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text: input.text,
          html,
          reply_to: replyTo,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        console.error("Resend rejected mail", response.status, detail.slice(0, 400));
        return { sent: false, reason: "The mail server rejected the message." };
      }
      return { sent: true };
    }

    const transport = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_PORT === "465",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
    });
    await transport.sendMail({
      from,
      to,
      subject,
      text: input.text,
      html,
      replyTo,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendEmail failed", error);
    return { sent: false, reason: "The mail server rejected the message." };
  }
}
