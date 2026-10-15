export type ProductCsvResult = {
  ok: boolean;
  message: string;
  created: string[];
  skipped: string[];
  attached: string[];
  unmatched: string[];
  errors: string[];
};

export type InventoryCsvResult = {
  ok: boolean;
  message: string;
  updated: { sku: string; from: number; to: number }[];
  skipped: string[];
  errors: string[];
};
