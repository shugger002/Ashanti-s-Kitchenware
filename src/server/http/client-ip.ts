/** Client address behind this shop's nginx (X-Real-IP, else last X-Forwarded-For hop). */
export function clientIp(headersList: Headers): string | null {
  const real = headersList.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const forwarded = headersList.get("x-forwarded-for");
  if (!forwarded) return null;
  const parts = forwarded
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts.at(-1);
  return last ? last.slice(0, 64) : null;
}
