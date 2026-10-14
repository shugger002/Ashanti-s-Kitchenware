export const CURRENCY = "GHS" as const;

export function parseMoney(value: string | number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new Error("Invalid money value");
  }
  return Math.round(n * 100) / 100;
}

export function formatGhs(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(n);
}

/** Paystack charges in pesewas (1 GHS = 100 pesewas). */
export function ghsToPesewas(amount: number | string): number {
  return Math.round(parseMoney(amount) * 100);
}

export function pesewasToGhs(pesewas: number): number {
  return parseMoney(pesewas / 100);
}
