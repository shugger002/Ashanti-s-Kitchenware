function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export function getAppUrl(): string {
  const explicit = process.env.APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function getSessionSecret(): string {
  return required("SESSION_SECRET", "dev-only-change-me-32-characters-min");
}

export function getSessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME ?? "ak_session";
}

export function getSessionTtlDays(): number {
  return Number(process.env.SESSION_TTL_DAYS ?? "14");
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getAnalyticsMeasurementId(): string | null {
  const id = process.env.ANALYTICS_MEASUREMENT_ID?.trim() ?? "";
  return /^G-[A-Z0-9]+$/i.test(id) ? id : null;
}
