import { csvHeaderKey, normalizeCsvText, parseCsvInt, splitCsvLine } from "@/lib/csv";
import { matchProductFromFilename } from "@/server/catalog/image-names";
import { slugify } from "@/lib/utils";

export type CatalogRef = { sku: string; name: string };

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
const MAX_QTY = 10_000;

function headerKey(value: string) {
  return csvHeaderKey(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function isSkuHeader(key: string) {
  if (key.includes("sku") || key.replaceAll("_", "") === "sku") return true;
  return ["code", "item_code", "product_code", "barcode", "item_no", "item_number", "part_no"].includes(key);
}

function isNameHeader(key: string) {
  return ["name", "product", "product_name", "item", "item_name", "title", "description"].includes(key);
}

function isRestockHeader(key: string) {
  return ["restock", "qty", "quantity", "add", "units", "pieces", "incoming", "qnty"].includes(key);
}

function isOnHandHeader(key: string) {
  return ["on_hand", "onhand", "stock", "count", "inventory", "available", "shelf", "qty_on_hand"].includes(key);
}

export function resolveInventoryKey(raw: string, catalog: CatalogRef[]): string | null {
  const text = raw.trim();
  if (!text) return null;
  const skuExact = catalog.find((row) => row.sku.toLowerCase() === text.toLowerCase());
  if (skuExact) return skuExact.sku;
  const nameExact = catalog.filter((row) => row.name.toLowerCase() === text.toLowerCase());
  if (nameExact.length === 1) return nameExact[0].sku;
  const slug = slugify(text);
  const slugExact = catalog.filter((row) => slugify(row.name) === slug);
  if (slugExact.length === 1) return slugExact[0].sku;
  return matchProductFromFilename(`${text}.jpg`, catalog)?.sku ?? null;
}

function parseStructured(raw: string, catalog: CatalogRef[]): CsvParseResult {
  const errors: string[] = [];
  const text = normalizeCsvText(raw);
  if (!text) {
    return { rows: [], errors: ["The file is empty."] };
  }
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: ["Add a header row and at least one product row."] };
  }

  let headerAt = -1;
  let headers: string[] = [];
  let skuIndex = -1;
  let nameIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const keys = splitCsvLine(lines[i] ?? "").map(headerKey);
    const nextSku = keys.findIndex(isSkuHeader);
    const nextName = keys.findIndex(isNameHeader);
    const nextQty = keys.findIndex((key) => isRestockHeader(key) || isOnHandHeader(key));
    if ((nextSku >= 0 || nextName >= 0) && (nextQty >= 0 || nextSku >= 0)) {
      headerAt = i;
      headers = keys;
      skuIndex = nextSku;
      nameIndex = nextName;
      break;
    }
  }
  if (headerAt < 0) {
    return { rows: [], errors: [] };
  }

  const dataLines = lines.length - headerAt - 1;
  if (dataLines > MAX_ROWS) {
    return { rows: [], errors: [`Use at most ${MAX_ROWS} product rows.`] };
  }

  const restockIndex = headers.findIndex(isRestockHeader);
  const onHandIndex = headers.findIndex(isOnHandHeader);
  if (restockIndex < 0 && onHandIndex < 0) {
    return { rows: [], errors: ["Include a restock column (pieces to add) or an on_hand column (new shelf count)."] };
  }

  const rows: CsvInventoryChange[] = [];
  for (let i = headerAt + 1; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const cells = splitCsvLine(lines[i] ?? "");
    const skuCell = skuIndex >= 0 ? (cells[skuIndex] ?? "").trim() : "";
    const nameCell = nameIndex >= 0 ? (cells[nameIndex] ?? "").trim() : "";
    const sku = resolveInventoryKey(skuCell, catalog) ?? resolveInventoryKey(nameCell, catalog) ?? skuCell;
    if (!sku) {
      errors.push(`Line ${lineNo}: missing SKU or product name.`);
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
    if (restock != null && restock > MAX_QTY) {
      errors.push(`Line ${lineNo} (${sku}): restock looks too large.`);
      continue;
    }
    rows.push({ line: lineNo, sku, restock, onHand });
  }
  return { rows, errors };
}

function parseLooseCatalogLines(raw: string, catalog: CatalogRef[]): CsvParseResult {
  if (catalog.length === 0) return { rows: [], errors: [] };
  const rows: CsvInventoryChange[] = [];
  const errors: string[] = [];
  const lines = normalizeCsvText(raw).split("\n");
  const sorted = [...catalog].sort((a, b) => b.name.length - a.name.length);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim() ?? "";
    if (!line) continue;
    const qtyMatch = line.match(/[\s,;]+(-?\d+)\s*$/);
    const qty = qtyMatch ? Number(qtyMatch[1]) : null;
    if (qty == null || qty < 0 || qty > MAX_QTY) continue;
    const label = qtyMatch ? line.slice(0, qtyMatch.index).trim() : line;
    let sku = resolveInventoryKey(label, catalog);
    if (!sku) {
      const lower = line.toLowerCase();
      const named = sorted.find((row) => lower.includes(row.name.toLowerCase()) || lower.includes(row.sku.toLowerCase()));
      sku = named?.sku ?? null;
    }
    if (!sku) continue;
    rows.push({ line: i + 1, sku, restock: qty, onHand: null });
  }
  return { rows, errors };
}

export function parseInventoryCsv(raw: string, catalog: CatalogRef[] = []): CsvParseResult {
  const structured = parseStructured(raw, catalog);
  if (structured.rows.length > 0 || structured.errors.some((error) => /restock|on_hand|at most/i.test(error))) {
    return structured;
  }
  const loose = parseLooseCatalogLines(raw, catalog);
  if (loose.rows.length > 0) return loose;
  if (!normalizeCsvText(raw)) {
    return { rows: [], errors: ["The file is empty."] };
  }
  return {
    rows: [],
    errors: [
      structured.errors[0] ??
        "No sku or product name column found. Use the downloadable template, or add sku and restock columns before saving the sheet as PDF.",
    ],
  };
}
