import { query } from "@/server/db/pool";
import { likeContains, sql, sqlAnd } from "@/server/db/sql";
import type { Category, ProductCard, ProductColorOption, ProductDetail, ProductImage, ProductVariant } from "@/server/catalog/types";
import { filterDemoProducts, getDemoProduct } from "@/content/demo-catalog";
import { colorsFromVariants, normalizeHex } from "@/lib/product-color";

const DEMO_CATEGORIES: Category[] = [
  { id: "demo-cat-cookware", slug: "cookware", name: "Cookware", description: "Pots, pans, and cooking sets.", imageUrl: "/demo/pot-set.jpg", sortOrder: 10, isActive: true, parentId: null },
  { id: "demo-cat-appliances", slug: "kitchen-appliances", name: "Kitchen Appliances", description: "Blenders, cookers, fryers, and related appliances.", imageUrl: "/demo/blender.jpg", sortOrder: 20, isActive: true, parentId: null },
  { id: "demo-cat-tableware", slug: "tableware", name: "Tableware", description: "Plates, serving pieces, and dining sets.", imageUrl: "/demo/tableware.jpg", sortOrder: 30, isActive: true, parentId: null },
  { id: "demo-cat-storage", slug: "storage-insulation", name: "Insulation & Food Storage", description: "Racks, lunch boxes, insulation, and food storage.", imageUrl: "/demo/storage-rack.jpg", sortOrder: 40, isActive: true, parentId: null },
  { id: "demo-cat-home", slug: "home-essentials", name: "Home Essentials", description: "Household items sold alongside the kitchen range.", imageUrl: "/demo/kettle.jpg", sortOrder: 50, isActive: true, parentId: null },
];

function available(onHand: string | number, reserved: string | number): number {
  return Number(onHand) - Number(reserved);
}

export async function listCategories(activeOnly = true): Promise<Category[]> {
  if (!process.env.DATABASE_URL) return DEMO_CATEGORIES.filter((c) => !activeOnly || c.isActive);
  const result = await query<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
    parent_id: string | null;
  }>(sql`
    SELECT id, slug, name, description, image_url, sort_order, is_active, parent_id
     FROM categories
     ${activeOnly ? sql`WHERE is_active = TRUE` : sql``}
     ORDER BY sort_order, name
  `);
  const mapped = result.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    parentId: row.parent_id,
  }));
  return mapped.length > 0 ? mapped : DEMO_CATEGORIES.filter((c) => !activeOnly || c.isActive);
}

function demoSearch(filters: ShopFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
  const all = filterDemoProducts({
    ...filters,
    category: filters.category ? resolveCategorySlug(filters.category) : undefined,
  });
  const start = (page - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    total: all.length,
    page,
    pageSize,
  };
}

const CATEGORY_ALIASES: Record<string, string> = {
  "cooking-ware": "cookware",
  insulations: "storage-insulation",
  "insulation-food-storage": "storage-insulation",
};

export function resolveCategorySlug(slug: string) {
  return CATEGORY_ALIASES[slug] ?? slug;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const resolved = resolveCategorySlug(slug);
  const cats = await listCategories(false);
  return cats.find((c) => c.slug === resolved && c.isActive) ?? null;
}

type ShopFilters = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "featured";
  page?: number;
  pageSize?: number;
  featured?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  includeInactive?: boolean;
};

export async function searchProducts(filters: ShopFilters): Promise<{
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
}> {
  if (!process.env.DATABASE_URL) {
    return demoSearch(filters);
  }
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
  const where = [sql`p.archived_at IS NULL`];

  if (!filters.includeInactive) {
    where.push(sql`p.is_active = TRUE`);
  }
  if (filters.q) {
    const pattern = likeContains(filters.q);
    where.push(
      sql`(p.name ILIKE ${pattern} ESCAPE E'\\\\' OR p.sku ILIKE ${pattern} ESCAPE E'\\\\' OR p.description ILIKE ${pattern} ESCAPE E'\\\\')`,
    );
  }
  if (filters.category) {
    where.push(sql`c.slug = ${resolveCategorySlug(filters.category)}`);
  }
  if (filters.minPrice != null) {
    where.push(sql`COALESCE(p.sale_price, p.price) >= ${filters.minPrice}`);
  }
  if (filters.maxPrice != null) {
    where.push(sql`COALESCE(p.sale_price, p.price) <= ${filters.maxPrice}`);
  }
  if (filters.featured) where.push(sql`p.is_featured = TRUE`);
  if (filters.isNew) where.push(sql`p.is_new = TRUE`);
  if (filters.onSale) where.push(sql`p.sale_price IS NOT NULL AND p.sale_price < p.price`);
  if (filters.inStock) {
    where.push(sql`COALESCE((
      SELECT SUM(GREATEST(i.on_hand - i.reserved, 0)) FROM inventory i WHERE i.product_id = p.id
    ), 0) > 0`);
  }

  const order =
    filters.sort === "price_asc"
      ? sql`COALESCE(p.sale_price, p.price) ASC`
      : filters.sort === "price_desc"
        ? sql`COALESCE(p.sale_price, p.price) DESC`
        : filters.sort === "featured"
          ? sql`p.is_featured DESC, p.created_at DESC`
          : filters.onSale
            ? sql`(p.price - p.sale_price) / NULLIF(p.price, 0) DESC, p.updated_at DESC`
            : sql`p.created_at DESC`;

  const whereSql = sqlAnd(where);
  const offset = (page - 1) * pageSize;
  const [count, result] = await Promise.all([
    query<{ count: string }>(sql`
    SELECT count(*)::text AS count
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${whereSql}
  `),
    query<{
    id: string;
    slug: string;
    name: string;
    sku: string;
    price: string;
    sale_price: string | null;
    currency: string;
    is_new: boolean;
    is_featured: boolean;
    is_active: boolean;
    category_slug: string | null;
    category_name: string | null;
    image_id: string | null;
    image_url: string | null;
    image_alt: string | null;
    storage_key: string | null;
    available: string;
    colors: { variantId: string; name: string; hex: string }[] | string;
    review_count: string;
    rating_average: string | null;
  }>(sql`
    SELECT p.id, p.slug, p.name, p.sku, p.price::text, p.sale_price::text, p.currency,
            p.is_new, p.is_featured, p.is_active, c.slug AS category_slug, c.name AS category_name,
            img.id AS image_id, img.url AS image_url, img.alt AS image_alt, img.storage_key,
            COALESCE((
              SELECT SUM(GREATEST(i.on_hand - i.reserved, 0)) FROM inventory i WHERE i.product_id = p.id
            ), 0)::text AS available,
            COALESCE((
              SELECT json_agg(json_build_object(
                'variantId', v.id,
                'name', COALESCE(v.attributes->>'color', v.name),
                'hex', COALESCE(NULLIF(v.attributes->>'hex', ''), '#888888')
              ) ORDER BY v.name)
              FROM product_variants v
              WHERE v.product_id = p.id AND v.is_active = TRUE
            ), '[]'::json) AS colors,
            COALESCE((
              SELECT COUNT(*)::text FROM product_reviews r
              WHERE r.product_id = p.id AND r.is_published = TRUE
            ), '0') AS review_count,
            (SELECT AVG(r.rating)::text FROM product_reviews r
             WHERE r.product_id = p.id AND r.is_published = TRUE) AS rating_average
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN LATERAL (
       SELECT * FROM product_images pi
       WHERE pi.product_id = p.id
       ORDER BY pi.is_primary DESC, pi.sort_order ASC
       LIMIT 1
     ) img ON TRUE
     WHERE ${whereSql}
     ORDER BY ${order}
     LIMIT ${pageSize} OFFSET ${offset}
  `),
  ]);
  const total = Number(count.rows[0]?.count ?? 0);
  if (total === 0) return demoSearch(filters);

  return {
    total,
    page,
    pageSize,
    items: result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      sku: row.sku,
      price: row.price,
      salePrice: row.sale_price,
      currency: row.currency,
      isNew: row.is_new,
      isFeatured: row.is_featured,
      isActive: row.is_active,
      categorySlug: row.category_slug,
      categoryName: row.category_name,
      available: Number(row.available),
      colors: parseColors(row.colors),
      reviewCount: Number(row.review_count),
      ratingAverage: row.rating_average == null ? null : Number(row.rating_average),
      primaryImage: row.image_id
        ? {
            id: row.image_id,
            url: row.image_url ?? "",
            alt: row.image_alt ?? row.name,
            isPrimary: true,
            storageKey: row.storage_key ?? "",
          }
        : null,
    })),
  };
}

export type AdminProductRow = {
  id: string;
  name: string;
  sku: string;
  price: string;
  salePrice: string | null;
  categoryName: string | null;
  available: number;
  isActive: boolean;
};

export async function listAdminProducts(q?: string): Promise<AdminProductRow[]> {
  if (!process.env.DATABASE_URL) {
    return demoSearch({ q, includeInactive: true, pageSize: 80 }).items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      price: item.price,
      salePrice: item.salePrice,
      categoryName: item.categoryName,
      available: item.available,
      isActive: item.isActive,
    }));
  }
  const where = [sql`p.archived_at IS NULL`];
  if (q?.trim()) {
    const pattern = likeContains(q.trim());
    where.push(
      sql`(p.name ILIKE ${pattern} ESCAPE E'\\\\' OR p.sku ILIKE ${pattern} ESCAPE E'\\\\')`,
    );
  }
  const result = await query<{
    id: string;
    name: string;
    sku: string;
    price: string;
    sale_price: string | null;
    category_name: string | null;
    available: string;
    is_active: boolean;
  }>(sql`
    SELECT p.id, p.name, p.sku, p.price::text, p.sale_price::text, p.is_active,
            c.name AS category_name,
            COALESCE((
              SELECT SUM(GREATEST(i.on_hand - i.reserved, 0)) FROM inventory i WHERE i.product_id = p.id
            ), 0)::text AS available
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${sqlAnd(where)}
     ORDER BY p.created_at DESC
     LIMIT 80
  `);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: row.price,
    salePrice: row.sale_price,
    categoryName: row.category_name,
    available: Number(row.available),
    isActive: row.is_active,
  }));
}

export async function getProductBySlug(slug: string, opts?: { includeInactive?: boolean }): Promise<ProductDetail | null> {
  if (!process.env.DATABASE_URL) return getDemoProduct(slug);
  const result = await query<{
    id: string;
    slug: string;
    name: string;
    sku: string;
    description: string;
    specifications: Record<string, string>;
    price: string;
    sale_price: string | null;
    currency: string;
    is_new: boolean;
    is_featured: boolean;
    is_active: boolean;
    has_variants: boolean;
    seo_title: string | null;
    seo_description: string | null;
    category_id: string | null;
    category_slug: string | null;
    category_name: string | null;
    low_stock_threshold: number;
    review_count: string;
    rating_average: string | null;
  }>(sql`
    SELECT p.id, p.slug, p.name, p.sku, p.description, p.specifications,
            p.price::text AS price, p.sale_price::text AS sale_price, p.currency,
            p.is_new, p.is_featured, p.is_active, p.has_variants,
            p.seo_title, p.seo_description, p.category_id, p.low_stock_threshold,
            c.slug AS category_slug, c.name AS category_name,
            COALESCE((
              SELECT COUNT(*)::text FROM product_reviews r
              WHERE r.product_id = p.id AND r.is_published = TRUE
            ), '0') AS review_count,
            (SELECT AVG(r.rating)::text FROM product_reviews r
             WHERE r.product_id = p.id AND r.is_published = TRUE) AS rating_average
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ${slug} AND p.archived_at IS NULL
       ${opts?.includeInactive ? sql`` : sql`AND p.is_active = TRUE`}
  `);
  const row = result.rows[0];
  if (!row) return getDemoProduct(slug);

  const images = await query<{
    id: string;
    url: string;
    alt: string;
    is_primary: boolean;
    storage_key: string;
  }>(sql`
    SELECT id, url, alt, is_primary, storage_key FROM product_images
     WHERE product_id = ${row.id} ORDER BY is_primary DESC, sort_order ASC
  `);

  const variants = await query<{
    id: string;
    sku: string;
    name: string;
    attributes: Record<string, string>;
    price_override: string | null;
    is_active: boolean;
    on_hand: string | null;
    reserved: string | null;
  }>(sql`
    SELECT v.id, v.sku, v.name, v.attributes, v.price_override::text, v.is_active,
            i.on_hand::text, i.reserved::text
     FROM product_variants v
     LEFT JOIN inventory i ON i.variant_id = v.id
     WHERE v.product_id = ${row.id}
     ORDER BY v.name
  `);

  const inv = await query<{ on_hand: string; reserved: string }>(sql`
    SELECT COALESCE(SUM(on_hand),0)::text AS on_hand, COALESCE(SUM(reserved),0)::text AS reserved
     FROM inventory WHERE product_id = ${row.id}
  `);

  const imageList: ProductImage[] = images.rows.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
    isPrimary: img.is_primary,
    storageKey: img.storage_key,
  }));

  const variantList: ProductVariant[] = variants.rows.map((v) => ({
    id: v.id,
    sku: v.sku,
    name: v.name,
    attributes: v.attributes ?? {},
    priceOverride: v.price_override,
    isActive: v.is_active,
    onHand: Number(v.on_hand ?? 0),
    reserved: Number(v.reserved ?? 0),
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    description: row.description,
    specifications: row.specifications ?? {},
    price: row.price,
    salePrice: row.sale_price,
    currency: row.currency,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    hasVariants: row.has_variants,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    lowStockThreshold: row.low_stock_threshold,
    available: available(inv.rows[0]?.on_hand ?? 0, inv.rows[0]?.reserved ?? 0),
    images: imageList,
    variants: variantList,
    colors: colorsFromVariants(variantList),
    reviewCount: Number(row.review_count),
    ratingAverage: row.rating_average == null ? null : Number(row.rating_average),
    primaryImage: imageList[0] ?? null,
  };
}

function parseColors(value: { variantId: string; name: string; hex: string }[] | string | null): ProductColorOption[] {
  const rows = typeof value === "string" ? (JSON.parse(value) as { variantId: string; name: string; hex: string }[]) : (value ?? []);
  return rows.map((row) => ({
    variantId: row.variantId,
    name: row.name,
    hex: normalizeHex(row.hex, row.name),
  }));
}

export async function relatedProducts(
  productId: string,
  categorySlug: string | null,
): Promise<ProductCard[]> {
  if (!categorySlug) return [];
  const { items } = await searchProducts({ category: categorySlug, pageSize: 8 });
  return items.filter((p) => p.id !== productId).slice(0, 4);
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const slug = await query<{ slug: string }>(sql`SELECT slug FROM products WHERE id = ${id}`);
  if (!slug.rows[0]) return null;
  return getProductBySlug(slug.rows[0].slug, { includeInactive: true });
}
