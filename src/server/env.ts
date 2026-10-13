function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export function getAppUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
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
