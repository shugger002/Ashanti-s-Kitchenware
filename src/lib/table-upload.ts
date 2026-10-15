import { csvCell, normalizeCsvText } from "@/lib/csv";

export const TABLE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export function assertTableUploadSize(bytes: number) {
  if (bytes > TABLE_UPLOAD_MAX_BYTES) {
    throw new Error("File must be 10 MB or smaller.");
  }
}

function decodeName(name: string) {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

export function isPdfUpload(file: { name: string; type: string }, bytes?: Uint8Array) {
  if (bytes && bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return true;
  }
  if (looksLikeZip(bytes) || looksLikeXls(bytes)) return false;
  if (file.type === "application/pdf") return true;
  return decodeName(file.name).toLowerCase().includes(".pdf");
}

function looksLikeZip(bytes?: Uint8Array) {
  return Boolean(bytes && bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b);
}

function looksLikeXls(bytes?: Uint8Array) {
  return Boolean(bytes && bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf);
}

function looksLikePdf(bytes?: Uint8Array) {
  return Boolean(bytes && bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46);
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

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes.slice() });
  try {
    const text = await parser.getText();
    const extracted = tabularTextToCsv(text.text ?? "");
    const plain = (text.text ?? "").trim();
    const combined = [extracted, plain].filter(Boolean).join("\n\n").trim();
    if (!combined) {
      throw new Error(
        "That PDF has no selectable text. In Google Sheets use File → Download → Comma-separated values (.csv).",
      );
    }
    return combined;
  } finally {
    try {
      await parser.destroy();
    } catch {
      /* ignore */
    }
  }
}

async function extractWorkbookText(bytes: Uint8Array): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(bytes, { type: "array", cellDates: false, raw: false });
  const chunks: string[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim();
    if (csv) chunks.push(csv);
  }
  const text = chunks.join("\n\n").trim();
  if (!text) throw new Error("That spreadsheet is empty.");
  return text;
}

export async function extractSpreadsheetText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) throw new Error("The file is empty.");
  if (looksLikePdf(bytes) || (isPdfUpload(file, bytes) && !looksLikeZip(bytes) && !looksLikeXls(bytes))) {
    return extractPdfText(bytes);
  }
  if (looksLikeZip(bytes) || looksLikeXls(bytes) || /\.(xlsx|xls|ods)$/i.test(decodeName(file.name))) {
    return extractWorkbookText(bytes);
  }
  return tabularTextToCsv(Buffer.from(bytes).toString("utf8"));
}

export const extractInventorySpreadsheetText = extractSpreadsheetText;
