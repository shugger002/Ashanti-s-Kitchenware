import { unstable_cache } from "next/cache";
import { readFileSync } from "node:fs";
import path from "node:path";
import { HeroSlideshow, type HeroSlide } from "@/components/store/hero-slideshow";
import { isDemoListing } from "@/lib/listing";
import { searchProducts } from "@/server/catalog/queries";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import type { ProductCard } from "@/server/catalog/types";

/** A full-bleed slide needs a real photograph, not a thumbnail stretched across the screen. */
const MIN_SLIDE_WIDTH = 900;
const MIN_SLIDE_HEIGHT = 640;

const remoteSizes = new Map<string, { width: number; height: number } | null>();

function discountOf(product: ProductCard) {
  if (!product.salePrice || Number(product.price) <= 0) return 0;
  const cut = Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100);
  return cut > 0 ? cut : 0;
}

function toSlide(product: ProductCard, imageUrl: string, imageAlt: string): HeroSlide {
  return {
    id: product.slug,
    kind: "product",
    slug: product.slug,
    name: product.name,
    imageUrl,
    imageAlt: imageAlt || product.name,
    price: product.price,
    salePrice: discountOf(product) > 0 ? product.salePrice : null,
    discount: discountOf(product),
  };
}

const shopPhotograph: HeroSlide = {
  id: "shop-photograph",
  kind: "photo",
  name: "Kitchen utensils",
  imageUrl: "/demo/hero.jpg?v=2",
  imageAlt: "Kitchen utensils hung on a wall and arranged on a counter",
};

/** Wide photographs made for the slideshow, matched to pieces already in the shop. */
const slidePhotos: Record<string, string> = {
  "2L-blender": "/slides/blender.jpg",
  "electric-kettle-2-0l-st-8856": "/slides/kettle.jpg",
  "rice-cooker-mixed-colour": "/slides/rice-cooker.jpg",
  "12-piece-cookware-set": "/slides/cookware.jpg",
};

export async function HomeHero() {
  const [sale, featured] = await Promise.all([
    searchProducts({ onSale: true, inStock: true, pageSize: 12 }),
    searchProducts({ inStock: true, sort: "featured", pageSize: 48 }),
  ]);
  const chosen: ProductCard[] = [];
  const seen = new Set<string>();
  for (const product of [...sale.items, ...featured.items]) {
    if (seen.has(product.id) || isDemoListing(product.sku, product.slug) || product.available <= 0) continue;
    seen.add(product.id);
    chosen.push(product);
  }
  const photos = await sharpestPhotos(chosen.map((product) => product.id));
  const slides: HeroSlide[] = [];
  const promoFirst = [...chosen.filter((product) => discountOf(product) > 0), ...chosen.filter((product) => discountOf(product) === 0)];
  const curatedFirst = [
    ...promoFirst.filter((product) => slidePhotos[product.slug]),
    ...promoFirst.filter((product) => !slidePhotos[product.slug]),
  ];
  for (const product of curatedFirst) {
    const override = slidePhotos[product.slug];
    const photo = photos[product.id];
    const imageUrl = override || photo?.url;
    if (!imageUrl) continue;
    slides.push(toSlide(product, imageUrl, photo?.alt || product.primaryImage?.alt || product.name));
    if (slides.length >= 5) break;
  }
  return <HeroSlideshow slides={[shopPhotograph, ...slides]} />;
}

function fitsSlide(size: { width: number; height: number }) {
  return size.width >= MIN_SLIDE_WIDTH && size.height >= MIN_SLIDE_HEIGHT;
}

const sharpestPhotos = unstable_cache(
  async (productIds: string[]) => {
    const best: Record<string, { url: string; alt: string; area: number }> = {};
    if (productIds.length === 0) return best;
    const images = await query<{ product_id: string; url: string; alt: string | null }>(sql`
      SELECT product_id, url, alt
      FROM product_images
      WHERE product_id = ANY(${productIds}::uuid[])
      ORDER BY is_primary DESC, sort_order ASC
    `);
    const sizes = await Promise.all(images.rows.map(async (row) => ({ row, size: await imageSizeFor(row.url) })));
    for (const { row, size } of sizes) {
      if (!size || !fitsSlide(size)) continue;
      const area = size.width * size.height;
      const current = best[row.product_id];
      if (!current || area > current.area) best[row.product_id] = { url: row.url, alt: row.alt ?? "", area };
    }
    return best;
  },
  ["hero-sharp-photos"],
  { revalidate: 300, tags: ["catalog"] },
);

async function imageSizeFor(imageUrl: string) {
  if (/^https?:\/\//i.test(imageUrl)) return remoteImageSize(imageUrl);
  return localImageSize(imageUrl);
}

async function remoteImageSize(imageUrl: string) {
  if (remoteSizes.has(imageUrl)) return remoteSizes.get(imageUrl) ?? null;
  try {
    const response = await fetch(imageUrl, {
      headers: { Range: "bytes=0-131071" },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok && response.status !== 206) {
      remoteSizes.set(imageUrl, null);
      return null;
    }
    const size = imageSize(Buffer.from(await response.arrayBuffer()));
    remoteSizes.set(imageUrl, size);
    return size;
  } catch {
    remoteSizes.set(imageUrl, null);
    return null;
  }
}
function localImageSize(imageUrl: string) {
  const relative = imageUrl.split("?")[0]?.replace(/^\/+/, "");
  if (!relative || relative.includes("..")) return null;
  try {
    const bytes = readFileSync(path.join(process.cwd(), "public", relative));
    return imageSize(bytes.subarray(0, Math.min(bytes.length, 262144)));
  } catch {
    return null;
  }
}

function imageSize(bytes: Buffer) {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes.toString("ascii", 1, 4) === "PNG") {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xd9 || marker === 0xda) return null;
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length) return null;
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}
