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

function isNameHeader(key: string) {
  if (isSkuHeader(key) || isPriceHeader(key)) return false;
  return (
    /^(name|product|title|item|desc)/.test(key) ||
    key.includes("product_name") ||
    key.includes("item_name") ||
    key === "goods"
  );
}

function isSkuHeader(key: string) {
  return (
    key.includes("sku") ||
    /^(code|barcode|ean|upc|model|ref|reference)$/.test(key) ||
    /item_code|product_code|stock_code|sku_code/.test(key)
  );
}

function isPriceHeader(key: string) {
  if (key.includes("sale") && !key.includes("regular")) return false;
  return /price|ghs|cedi|amount|retail|unit_price|selling/.test(key);
}

function looksLikeSku(value: string) {
  const text = value.trim();
  return /^[A-Z0-9][A-Z0-9._/-]{1,32}$/i.test(text) && /[A-Z]/i.test(text) && /[0-9]/.test(text);
}

function inferColumns(rows: string[][]): { name: number; sku: number; price: number } | null {
  const width = Math.max(0, ...rows.map((row) => row.length));
  if (width < 2) return null;
  const stats = Array.from({ length: width }, (_, index) => {
    const values = rows.map((row) => (row[index] ?? "").trim()).filter(Boolean);
    const count = Math.max(values.length, 1);
    return {
      index,
      numeric: values.filter((value) => parseCsvNumber(value) != null).length / count,
      skuLike: values.filter((value) => looksLikeSku(value)).length / count,
      avgLen: values.reduce((sum, value) => sum + value.length, 0) / count,
    };
  });
  const price = [...stats].filter((row) => row.numeric >= 0.5).sort((a, b) => b.numeric - a.numeric)[0];
  const sku = [...stats]
    .filter((row) => row.index !== price?.index && row.skuLike >= 0.4)
    .sort((a, b) => b.skuLike - a.skuLike)[0];
  const name = [...stats]
    .filter((row) => row.index !== price?.index && row.index !== sku?.index)
    .sort((a, b) => b.avgLen - a.avgLen)[0];
  if (price && sku && name && name.index !== sku.index && name.index !== price.index) {
    return { name: name.index, sku: sku.index, price: price.index };
  }
  if (width >= 3) {
    const thirdNumeric = stats[2] && stats[2].numeric >= 0.5;
    if (thirdNumeric) return { name: 0, sku: 1, price: 2 };
  }
  return null;
}

function parseRowsFromGrid(
  lines: string[],
  headerAt: number,
  headers: string[],
  nameIndex: number,
  skuIndex: number,
  priceIndex: number,
): CsvProductParseResult {
  const errors: string[] = [];
  if (lines.length - headerAt - 1 > MAX_ROWS) {
    return { rows: [], errors: [`Use at most ${MAX_ROWS} product rows.`] };
  }
  const saleIndex = col(headers, ["sale_price", "sale", "promo_price"]);
  const stockIndex = headers.findIndex((key) => ["stock", "on_hand", "qty", "quantity", "initial_stock"].includes(key) || key.includes("stock"));
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
    if (!name && !sku) continue;
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

function parseAsStackedCells(cells: string[]): CsvProductParseResult | null {
  let headerAt = -1;
  for (let i = 0; i < cells.length - 2; i += 1) {
    if (isNameHeader(csvHeaderKey(cells[i] ?? "")) && isSkuHeader(csvHeaderKey(cells[i + 1] ?? "")) && isPriceHeader(csvHeaderKey(cells[i + 2] ?? ""))) {
      headerAt = i;
      break;
    }
  }
  if (headerAt < 0) return null;
  const lines = ["name,sku,price"];
  for (let i = headerAt + 3; i + 2 < cells.length; i += 3) {
    lines.push([cells[i], cells[i + 1], cells[i + 2]].map((value) => value.replaceAll(",", " ")).join(","));
  }
  if (lines.length < 2) return null;
  return parseProductCsv(lines.join("\n"));
}

export function parseProductCsv(raw: string): CsvProductParseResult {
  const text = normalizeCsvText(raw);
  if (!text) return { rows: [], errors: ["The file is empty."] };
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: ["Add a header row and at least one product row."] };
  }

  let headerAt = 0;
  let headers = splitCsvLine(lines[0] ?? "").map(csvHeaderKey);
  let nameIndex = headers.findIndex(isNameHeader);
  let skuIndex = headers.findIndex(isSkuHeader);
  let priceIndex = headers.findIndex(isPriceHeader);
  for (let i = 0; i < Math.min(lines.length, 40); i += 1) {
    const keys = splitCsvLine(lines[i] ?? "").map(csvHeaderKey);
    const nextName = keys.findIndex(isNameHeader);
    const nextSku = keys.findIndex(isSkuHeader);
    const nextPrice = keys.findIndex(isPriceHeader);
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
    const body = lines.slice(0, 80).map((line) => splitCsvLine(line));
    const inferred = inferColumns(body.length > 1 ? body.slice(1) : body);
    if (inferred) {
      headerAt = body[0] && body[0].some((value) => isNameHeader(csvHeaderKey(value)) || isSkuHeader(csvHeaderKey(value)) || isPriceHeader(csvHeaderKey(value)))
        ? 0
        : -1;
      if (headerAt < 0) {
        lines.unshift("name,sku,price");
        headerAt = 0;
        headers = ["name", "sku", "price"];
        nameIndex = inferred.name;
        skuIndex = inferred.sku;
        priceIndex = inferred.price;
      } else {
        headers = splitCsvLine(lines[0] ?? "").map(csvHeaderKey);
        nameIndex = inferred.name;
        skuIndex = inferred.sku;
        priceIndex = inferred.price;
      }
    }
  }

  if (nameIndex >= 0 && skuIndex >= 0 && priceIndex >= 0) {
    const parsed = parseRowsFromGrid(lines, headerAt, headers, nameIndex, skuIndex, priceIndex);
    if (parsed.rows.length > 0) return parsed;
  }

  const stacked = parseAsStackedCells(lines.flatMap((line) => splitCsvLine(line).map((value) => value.trim()).filter(Boolean)));
  if (stacked && stacked.rows.length > 0) return stacked;

  return {
    rows: [],
    errors: ["Need columns for product name, SKU, and price. Easiest: Google Sheets → File → Download → Comma-separated values (.csv)."],
  };
}
