export function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function chartMax(values: number[], floor = 1): number {
  const peak = Math.max(0, ...values.filter((n) => Number.isFinite(n)));
  if (peak <= 0) return floor;
  const mag = 10 ** Math.floor(Math.log10(peak));
  const nice = Math.ceil(peak / mag) * mag;
  return nice > 0 ? nice : floor;
}

export function barHeight(value: number, max: number, innerHeight: number): number {
  if (max <= 0 || innerHeight <= 0 || value <= 0) return 0;
  return Math.max(1, (value / max) * innerHeight);
}

export function shareWidth(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.max(2, Math.round((value / max) * 100));
}

export function polarArc(
  startFraction: number,
  sweepFraction: number,
  radius: number,
  cx: number,
  cy: number,
): string {
  const sweep = Math.min(1, Math.max(0, sweepFraction));
  if (sweep <= 0) return "";
  const start = -Math.PI / 2 + Math.min(1, Math.max(0, startFraction)) * Math.PI * 2;
  const end = start + sweep * Math.PI * 2;
  const x1 = cx + radius * Math.cos(start);
  const y1 = cy + radius * Math.sin(start);
  const x2 = cx + radius * Math.cos(end);
  const y2 = cy + radius * Math.sin(end);
  const large = sweep > 0.5 ? 1 : 0;
  if (sweep >= 0.999) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`;
  }
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function sparkPoints(
  values: number[],
  width: number,
  height: number,
  pad = 2,
): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const step = values.length === 1 ? 0 : innerW / (values.length - 1);
  return values
    .map((value, i) => {
      const x = pad + i * step;
      const y = pad + innerH - (value / max) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function formatGhsShort(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    notation: n >= 1000 ? "compact" : "standard",
    maximumFractionDigits: n >= 1000 ? 1 : 0,
  }).format(n);
}
