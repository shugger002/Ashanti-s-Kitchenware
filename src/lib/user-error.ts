export function shopperError(error: unknown, fallback: string) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You're offline. Check your connection and try again.";
  }
  const raw =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/failed to fetch|networkerror|load failed|fetch failed|econnreset|enotfound|etimedout/i.test(raw)) {
    return "Could not reach the shop. Check your connection and try again.";
  }
  if (/emaxconnsession|max clients reached|pool_size|too many clients|remaining connection slots/i.test(raw)) {
    return "The shop is busy right now. Wait a moment and try again.";
  }
  if (!raw.trim()) return fallback;
  if (
    /undefined|cannot read|is not a function|\[object |status code|sql |postgres|exception|stack|digest|violates foreign key|insert or update on table|constraint/i.test(
      raw,
    )
  ) {
    return fallback;
  }
  if (raw.length > 160 || raw.includes("{")) return fallback;
  return raw;
}
