import { createTransport } from "nodemailer";

function headerLine(value: string) {
  return value.replace(/[\r\n\0]+/g, " ").trim();
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    return { sent: false, reason: "SMTP is not configured" };
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
    from: headerLine(process.env.SMTP_FROM),
    to: headerLine(input.to),
    subject: headerLine(input.subject),
    text: input.text,
  });
  return { sent: true };
}
