import { csvCell, normalizeCsvText } from "@/lib/csv";

export const TABLE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export function assertTableUploadSize(bytes: number) {
  if (bytes > TABLE_UPLOAD_MAX_BYTES) {
    throw new Error("File must be 10 MB or smaller.");
  }
}

export function isPdfUpload(file: { name: string; type: string }, bytes?: Uint8Array) {
  if (file.type === "application/pdf") return true;
  if (file.name.toLowerCase().includes(".pdf")) return true;
  if (bytes && bytes.length >= 5) {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }
  return false;
}

export function tableToCsv(table: string[][]): string {
  return table
    .map((row) => row.map((cell) => csvCell(String(cell ?? "").trim())).join(","))
    .filter((line) => line.replaceAll(",", "").trim().length > 0)
    .join("\n");
}

export function tabularTextToCsv(raw: string): string {
  const text = normalizeCsvText(raw);
  if (!text) return "";
  if (text.includes(",") || text.includes(";")) return text;
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.includes("\t")) {
        return trimmed
          .split("\t")
          .map((cell) => csvCell(cell.trim()))
          .join(",");
      }
      const spaced = trimmed.split(/\s{2,}/).map((cell) => cell.trim()).filter(Boolean);
      if (spaced.length > 1) return spaced.map((cell) => csvCell(cell)).join(",");
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) return parts.map((cell) => csvCell(cell)).join(",");
      return csvCell(trimmed);
    })
    .filter(Boolean)
    .join("\n");
}

function looksLikeInventoryTable(table: string[][]): boolean {
  const header = (table[0] ?? []).map((cell) => cell.toLowerCase().replace(/[\s-]+/g, "_")).join(" ");
  return /sku|product|item|code|qty|quantity|stock|restock|on.?hand|\bname\b/.test(header);
}

export async function extractInventorySpreadsheetText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfUpload(file, bytes)) {
    return tabularTextToCsv(Buffer.from(bytes).toString("utf8"));
  }
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes.slice() });
  try {
    const tables = await parser.getTable();
    const text = await parser.getText();
    const candidates = [...(tables.mergedTables ?? []), ...(tables.pages ?? []).flatMap((page) => page.tables)].filter(
      (table) => table.length > 0,
    );
    const ranked = [
      ...candidates.filter(looksLikeInventoryTable),
      ...candidates.sort((a, b) => b.length * (b[0]?.length ?? 0) - a.length * (a[0]?.length ?? 0)),
    ];
    const chunks = ranked.map((table) => tableToCsv(table));
    chunks.push(tabularTextToCsv(text.text ?? ""));
    chunks.push(text.text ?? "");
    return chunks.filter(Boolean).join("\n\n");
  } finally {
    await parser.destroy();
  }
}
