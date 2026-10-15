import { ASANTE_CONTAINER_STOCK } from "@/content/asante-container-stock";
import { importProductsFromCsv } from "@/server/catalog/admin";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import type { ProductCsvResult } from "@/lib/desk-import";

const CATEGORY_SEED = [
  { slug: "cookware", name: "Cookware", sort: 10 },
  { slug: "kitchen-appliances", name: "Kitchen Appliances", sort: 20 },
  { slug: "tableware", name: "Tableware", sort: 30 },
  { slug: "storage-insulation", name: "Insulation & Food Storage", sort: 40 },
  { slug: "home-essentials", name: "Home Essentials", sort: 50 },
];

export async function importAsanteContainerStock(actorId: string): Promise<ProductCsvResult> {
  for (const category of CATEGORY_SEED) {
    await query(sql`
      INSERT INTO categories (slug, name, description, sort_order, is_active)
      VALUES (${category.slug}, ${category.name}, ${""}, ${category.sort}, TRUE)
      ON CONFLICT (slug) DO NOTHING
    `);
  }
  const rows = ASANTE_CONTAINER_STOCK.map((item, index) => ({
    line: index + 2,
    name: item.name,
    sku: item.sku,
    price: item.price,
    salePrice: null,
    stock: item.stock,
    category: item.category,
    description: item.description,
    listed: false,
    featured: false,
    isNew: false,
    lowStock: 3,
    slug: "",
    imageUrl: "",
  }));
  const result = await importProductsFromCsv({ rows, actorId });
  await query(sql`
    UPDATE products
       SET archived_at = now(), is_active = FALSE
     WHERE archived_at IS NULL AND (sku ILIKE 'DEMO-%' OR slug ILIKE 'demo-%')
  `);
  const created = result.created.length;
  return {
    ok: created > 0 || result.skipped.length > 0,
    message:
      created > 0
        ? `Loaded ${created} piece${created === 1 ? "" : "s"} from the container list. They stay hidden on the shop until you add a photograph and list them.`
        : result.skipped.length > 0
          ? "The container list is already on the desk."
          : result.errors[0] ?? "Could not load the container list.",
    created: result.created,
    skipped: result.skipped,
    attached: [],
    unmatched: [],
    errors: result.errors,
  };
}
