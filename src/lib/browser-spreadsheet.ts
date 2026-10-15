import { csvCell, normalizeCsvText } from "@/lib/csv";

function looksLikePdf(bytes: Uint8Array) {
  return bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

function looksLikeZip(bytes: Uint8Array) {
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function looksLikeXls(bytes: Uint8Array) {
  return bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf;
}

function csvFromLines(raw: string) {
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

function itemsToCsv(items: { str: string; x: number; y: number }[]) {
  const rows = new Map<number, { str: string; x: number }[]>();
  for (const item of items) {
    const text = item.str.trim();
    if (!text) continue;
    const y = Math.round(item.y / 4) * 4;
    const row = rows.get(y) ?? [];
    row.push({ str: text, x: item.x });
    rows.set(y, row);
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, cells]) => {
      const ordered = cells.sort((a, b) => a.x - b.x);
      return ordered.map((cell) => csvCell(cell.str)).join(",");
    })
    .filter((line) => line.replaceAll(",", "").trim().length > 0)
    .join("\n");
}

async function extractPdf(bytes: Uint8Array) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const tables: string[] = [];
  const plain: string[] = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const items: { str: string; x: number; y: number }[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !("transform" in item)) continue;
      const transform = item.transform as number[];
      items.push({ str: String(item.str ?? ""), x: transform[4] ?? 0, y: transform[5] ?? 0 });
    }
    tables.push(itemsToCsv(items));
    plain.push(items.map((item) => item.str).join(" "));
  }
  const text = [tables.join("\n"), csvFromLines(plain.join("\n"))].filter(Boolean).join("\n\n").trim();
  if (!text) {
    throw new Error(
      "That PDF has no selectable text. In Google Sheets use File → Download → Comma-separated values (.csv).",
    );
  }
  return text;
}

async function extractWorkbook(bytes: Uint8Array) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(bytes, { type: "array", raw: false });
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

export async function extractSpreadsheetInBrowser(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) throw new Error("The file is empty.");
  if (looksLikePdf(bytes)) return extractPdf(bytes);
  if (looksLikeZip(bytes) || looksLikeXls(bytes) || /\.(xlsx|xls|ods)$/i.test(file.name)) {
    return extractWorkbook(bytes);
  }
  return csvFromLines(new TextDecoder().decode(bytes));
}

export async function prepareImportFormData(form: HTMLFormElement): Promise<FormData> {
  const data = new FormData(form);
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0) return data;
  const text = await extractSpreadsheetInBrowser(file);
  data.set("file", new File([text], "import.csv", { type: "text/csv" }));
  return data;
}
