export const CSV_MAX_BYTES = 512 * 1024;

export function assertCsvSize(bytes: number) {
  if (bytes > CSV_MAX_BYTES) {
    throw new Error("CSV must be 512 KB or smaller.");
  }
}

export function normalizeCsvText(raw: string) {
  return raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === "," || char === ";") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

export function csvHeaderKey(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function parseCsvNumber(raw: string): number | null {
  const text = raw.replace(/GHS|GH₵|₵/gi, "").replace(/,/g, "").replace(/\s/g, "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseCsvInt(raw: string): number | null {
  const n = parseCsvNumber(raw);
  return n == null ? null : Math.trunc(n);
}

export function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
