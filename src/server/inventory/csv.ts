import { csvHeaderKey, normalizeCsvText, parseCsvInt, splitCsvLine } from "@/lib/csv";

export type CsvInventoryChange = {
  line: number;
  sku: string;
  restock: number | null;
  onHand: number | null;
};

export type CsvParseResult = {
  rows: CsvInventoryChange[];
  errors: string[];
};

const MAX_ROWS = 2000;

export function parseInventoryCsv(raw: string): CsvParseResult {
  const errors: string[] = [];
  const text = normalizeCsvText(raw);
  if (!text) {
    return { rows: [], errors: ["The file is empty."] };
  }
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: ["Add a header row and at least one product row."] };
  }
  if (lines.length - 1 > MAX_ROWS) {
    return { rows: [], errors: [`Use at most ${MAX_ROWS} product rows.`] };
  }

  const headers = splitCsvLine(lines[0] ?? "").map(csvHeaderKey);
  const skuIndex = headers.findIndex((h) => h === "sku" || h === "sku_code" || h === "product_sku");
  const restockIndex = headers.findIndex((h) => h === "restock" || h === "qty" || h === "quantity" || h === "add");
  const onHandIndex = headers.findIndex((h) => h === "on_hand" || h === "onhand" || h === "stock" || h === "count");
  if (skuIndex < 0) {
    return { rows: [], errors: ["The first row must include a sku column."] };
  }
  if (restockIndex < 0 && onHandIndex < 0) {
    return { rows: [], errors: ["Include a restock column (pieces to add) or an on_hand column (new shelf count)."] };
  }

  const rows: CsvInventoryChange[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const cells = splitCsvLine(lines[i] ?? "");
    const sku = (cells[skuIndex] ?? "").trim();
    if (!sku) {
      errors.push(`Line ${lineNo}: missing SKU.`);
      continue;
    }
    const restock = restockIndex >= 0 ? parseCsvInt(cells[restockIndex] ?? "") : null;
    const onHand = onHandIndex >= 0 ? parseCsvInt(cells[onHandIndex] ?? "") : null;
    if (restockIndex >= 0 && (cells[restockIndex] ?? "").trim() && restock == null) {
      errors.push(`Line ${lineNo} (${sku}): restock must be a whole number.`);
      continue;
    }
    if (onHandIndex >= 0 && (cells[onHandIndex] ?? "").trim() && onHand == null) {
      errors.push(`Line ${lineNo} (${sku}): on_hand must be a whole number.`);
      continue;
    }
    if (restock == null && onHand == null) {
      errors.push(`Line ${lineNo} (${sku}): fill restock or on_hand.`);
      continue;
    }
    if (restock != null && restock < 0) {
      errors.push(`Line ${lineNo} (${sku}): restock cannot be negative. Use on_hand to set a lower count.`);
      continue;
    }
    if (onHand != null && onHand < 0) {
      errors.push(`Line ${lineNo} (${sku}): on_hand cannot be negative.`);
      continue;
    }
    rows.push({ line: lineNo, sku, restock, onHand });
  }
  return { rows, errors };
}
