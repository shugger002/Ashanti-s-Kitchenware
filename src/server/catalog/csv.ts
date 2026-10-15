import { csvHeaderKey, normalizeCsvText, parseCsvInt, parseCsvNumber, splitCsvLine } from "@/lib/csv";

export type CsvProductRow = {
  line: number;
  name: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  category: string;
  description: string;
  listed: boolean;
  featured: boolean;
  isNew: boolean;
  lowStock: number;
  slug: string;
  imageUrl: string;
};

export type CsvProductParseResult = {
  rows: CsvProductRow[];
  errors: string[];
};

const MAX_ROWS = 500;

function col(headers: string[], names: string[]) {
  return headers.findIndex((h) => names.includes(h));
}

function cell(cells: string[], index: number) {
  return index >= 0 ? (cells[index] ?? "").trim() : "";
}

function parseBool(raw: string, fallback: boolean) {
  const value = raw.trim().toLowerCase();
  if (!value) return fallback;
  if (["1", "true", "yes", "y", "listed", "on"].includes(value)) return true;
  if (["0", "false", "no", "n", "hidden", "off"].includes(value)) return false;
  return null;
}

function isSafeImageUrl(url: string) {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseProductCsv(raw: string): CsvProductParseResult {
  const errors: string[] = [];
  const text = normalizeCsvText(raw);
  if (!text) return { rows: [], errors: ["The file is empty."] };
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: ["Add a header row and at least one product row."] };
  }
  const nameHeaders = ["name", "product", "product_name", "title", "item", "item_name"];
  const skuHeaders = ["sku", "sku_code", "product_sku", "item_code", "code"];
  const priceHeaders = ["price", "ghs", "regular_price", "unit_price", "selling_price", "amount", "cedi", "cedis"];
  let headerAt = 0;
  let headers = splitCsvLine(lines[0] ?? "").map(csvHeaderKey);
  let nameIndex = col(headers, nameHeaders);
  let skuIndex = col(headers, skuHeaders);
  let priceIndex = col(headers, priceHeaders);
  for (let i = 0; i < Math.min(lines.length, 40); i += 1) {
    const keys = splitCsvLine(lines[i] ?? "").map(csvHeaderKey);
    const nextName = col(keys, nameHeaders);
    const nextSku = col(keys, skuHeaders);
    const nextPrice = col(keys, priceHeaders);
    if (nextName >= 0 && nextSku >= 0 && nextPrice >= 0) {
      headerAt = i;
      headers = keys;
      nameIndex = nextName;
      skuIndex = nextSku;
      priceIndex = nextPrice;
      break;
    }
  }
  if (nameIndex < 0 || skuIndex < 0 || priceIndex < 0) {
    return {
      rows: [],
      errors: [
        "Need columns named name, sku, and price. Google Sheets: File → Download → Comma-separated values (.csv).",
      ],
    };
  }
  if (lines.length - headerAt - 1 > MAX_ROWS) {
    return { rows: [], errors: [`Use at most ${MAX_ROWS} product rows.`] };
  }
  const saleIndex = col(headers, ["sale_price", "sale", "promo_price"]);
  const stockIndex = col(headers, ["stock", "on_hand", "qty", "quantity", "initial_stock"]);
  const categoryIndex = col(headers, ["category", "category_name", "category_slug"]);
  const descriptionIndex = col(headers, ["description", "details"]);
  const listedIndex = col(headers, ["listed", "is_active", "active", "publish"]);
  const featuredIndex = col(headers, ["featured", "is_featured"]);
  const newIndex = col(headers, ["new", "is_new"]);
  const lowIndex = col(headers, ["low_stock", "low_stock_threshold", "threshold"]);
  const slugIndex = col(headers, ["slug"]);
  const imageIndex = col(headers, ["image_url", "image", "photo", "photo_url"]);

  const rows: CsvProductRow[] = [];
  const seen = new Set<string>();
  for (let i = headerAt + 1; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const cells = splitCsvLine(lines[i] ?? "");
    const name = cell(cells, nameIndex);
    const sku = cell(cells, skuIndex);
    const priceRaw = cell(cells, priceIndex);
    if (!name || !sku) {
      errors.push(`Line ${lineNo}: name and sku are required.`);
      continue;
    }
    const skuKey = sku.toLowerCase();
    if (seen.has(skuKey)) {
      errors.push(`Line ${lineNo} (${sku}): duplicate SKU in this file.`);
      continue;
    }
    seen.add(skuKey);
    const price = parseCsvNumber(priceRaw);
    if (price == null || price < 0) {
      errors.push(`Line ${lineNo} (${sku}): price must be a Ghana Cedi amount.`);
      continue;
    }
    const saleRaw = cell(cells, saleIndex);
    const salePrice = saleRaw ? parseCsvNumber(saleRaw) : null;
    if (saleRaw && salePrice == null) {
      errors.push(`Line ${lineNo} (${sku}): sale_price must be a number.`);
      continue;
    }
    if (salePrice != null && (salePrice < 0 || salePrice >= price)) {
      errors.push(`Line ${lineNo} (${sku}): sale_price must be below the regular price.`);
      continue;
    }
    const stockRaw = cell(cells, stockIndex);
    const stock = stockRaw ? parseCsvInt(stockRaw) : 0;
    if (stockRaw && stock == null) {
      errors.push(`Line ${lineNo} (${sku}): stock must be a whole number.`);
      continue;
    }
    const listedParsed = parseBool(cell(cells, listedIndex), false);
    const featuredParsed = parseBool(cell(cells, featuredIndex), false);
    const newParsed = parseBool(cell(cells, newIndex), false);
    if (listedParsed == null || featuredParsed == null || newParsed == null) {
      errors.push(`Line ${lineNo} (${sku}): listed/featured/new must be yes or no.`);
      continue;
    }
    const lowRaw = cell(cells, lowIndex);
    const lowStock = lowRaw ? parseCsvInt(lowRaw) : 3;
    if (lowRaw && (lowStock == null || lowStock < 0)) {
      errors.push(`Line ${lineNo} (${sku}): low_stock must be a whole number.`);
      continue;
    }
    const imageUrl = cell(cells, imageIndex);
    if (imageUrl && !isSafeImageUrl(imageUrl)) {
      errors.push(`Line ${lineNo} (${sku}): image_url must be a site path or http(s) URL.`);
      continue;
    }
    rows.push({
      line: lineNo,
      name,
      sku,
      price,
      salePrice,
      stock: Math.max(0, stock ?? 0),
      category: cell(cells, categoryIndex),
      description: cell(cells, descriptionIndex),
      listed: listedParsed,
      featured: featuredParsed,
      isNew: newParsed,
      lowStock: lowStock ?? 3,
      slug: cell(cells, slugIndex),
      imageUrl,
    });
  }
  return { rows, errors };
}
