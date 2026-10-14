import type { ProductCard, ProductDetail, ProductVariant } from "@/server/catalog/types";
import { colorsFromVariants } from "@/lib/product-color";

export const DEMO_PHOTO_NOTICE =
  "Demo photography for layout only. Replace with real stock photos before launch.";

type DemoProduct = {
  slug: string;
  name: string;
  sku: string;
  price: string;
  salePrice?: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  image: string;
  featured?: boolean;
  isNew?: boolean;
  available: number;
  specifications: Record<string, string>;
  colours?: { slug: string; name: string; hex: string }[];
};

const demos: DemoProduct[] = [
  {
    slug: "demo-stainless-pot-set",
    name: "10-piece stainless pot set",
    sku: "DEMO-POT-10",
    price: "6199.00",
    description:
      "A stacked stainless cooking set for family meals. Demo listing — confirm price, contents, and photograph against real stock before sale.",
    categorySlug: "cookware",
    categoryName: "Cookware",
    image: "/demo/pot-set.jpg",
    featured: true,
    available: 7,
    specifications: { Pieces: "10", Material: "Stainless steel", Plug: "Not applicable" },
  },
  {
    slug: "demo-cast-iron-dutch-oven",
    name: "Cast iron Dutch oven",
    sku: "DEMO-DUTCH",
    price: "7499.00",
    description:
      "Heavy enamel-coated pot for stews. Demo listing — replace this photograph with the actual piece in the Accra shop.",
    categorySlug: "cookware",
    categoryName: "Cookware",
    image: "/demo/dutch-oven.jpg",
    featured: true,
    isNew: true,
    available: 4,
    specifications: { Material: "Cast iron with enamel", Use: "Stovetop and oven" },
    colours: [
      { slug: "char", name: "Charcoal", hex: "#3d3d3d" },
      { slug: "terr", name: "Terracotta", hex: "#c45c3e" },
      { slug: "steel", name: "Steel", hex: "#8aa0b4" },
      { slug: "navy", name: "Navy", hex: "#1b365d" },
      { slug: "fog", name: "Fog", hex: "#d8d6d2" },
      { slug: "sage", name: "Sage", hex: "#b7c9c2" },
      { slug: "cream", name: "Cream", hex: "#f3ead9" },
    ],
  },
  {
    slug: "demo-home-blender",
    name: "Home blender",
    sku: "DEMO-BLEND",
    price: "3299.00",
    salePrice: "2799.00",
    description:
      "Upright blender with a clear jug. Demo listing — wattage and plug type must be verified before publishing live.",
    categorySlug: "kitchen-appliances",
    categoryName: "Kitchen Appliances",
    image: "/demo/blender.jpg",
    featured: true,
    available: 12,
    specifications: { Type: "Jug blender" },
    colours: [
      { slug: "blk", name: "Black", hex: "#1a1a1a" },
      { slug: "wht", name: "White", hex: "#f4f4f4" },
      { slug: "red", name: "Red", hex: "#c8102e" },
    ],
  },
  {
    slug: "demo-air-fryer",
    name: "Digital air fryer",
    sku: "DEMO-AIRFRY",
    price: "4599.00",
    salePrice: "3899.00",
    description:
      "Basket-style air fryer. Demo listing — capacity and voltage must match the unit on the shelf.",
    categorySlug: "kitchen-appliances",
    categoryName: "Kitchen Appliances",
    image: "/demo/air-fryer.jpg",
    isNew: true,
    available: 8,
    specifications: { Style: "Drawer basket", Colour: "Black and white" },
  },
  {
    slug: "demo-electric-kettle",
    name: "Stainless electric kettle",
    sku: "DEMO-KETTLE",
    price: "1599.00",
    salePrice: "1299.00",
    description:
      "Cordless kettle shown with a 3-pin plug. Demo listing — confirm litre size against stock.",
    categorySlug: "kitchen-appliances",
    categoryName: "Kitchen Appliances",
    image: "/demo/kettle.jpg",
    featured: true,
    available: 25,
    specifications: { Material: "Stainless steel", Plug: "3-pin" },
    colours: [
      { slug: "ss", name: "Stainless", hex: "#c5c8cc" },
      { slug: "blk", name: "Black", hex: "#1a1a1a" },
      { slug: "wht", name: "White", hex: "#f4f4f4" },
    ],
  },
  {
    slug: "demo-tableware-set",
    name: "Gold-rim tableware set",
    sku: "DEMO-TABLE",
    price: "2899.00",
    salePrice: "2499.00",
    description:
      "Plates, bowls, and a jug for a dining table. Demo listing — piece count must be counted from the boxed set.",
    categorySlug: "tableware",
    categoryName: "Tableware",
    image: "/demo/tableware.jpg",
    featured: true,
    available: 15,
    specifications: { Finish: "Ceramic" },
    colours: [
      { slug: "ivy", name: "Ivory", hex: "#f6f1ea" },
      { slug: "gold", name: "Gold rim", hex: "#c9a227" },
      { slug: "sage", name: "Sage", hex: "#b7c9c2" },
    ],
  },
  {
    slug: "demo-rice-cooker",
    name: "5 litre rice cooker",
    sku: "DEMO-RICE",
    price: "2399.00",
    description:
      "Family-size rice cooker with a glass lid. Demo listing — confirm litre mark and plug before sale.",
    categorySlug: "kitchen-appliances",
    categoryName: "Kitchen Appliances",
    image: "/demo/rice-cooker.jpg",
    isNew: true,
    available: 19,
    specifications: { Capacity: "5 L", Plug: "3-pin" },
  },
  {
    slug: "demo-kitchen-storage-rack",
    name: "5-layer kitchen storage rack",
    sku: "DEMO-RACK",
    price: "2899.00",
    description:
      "Open metal rack for pans and dry goods. Demo listing — confirm height against the packed unit.",
    categorySlug: "storage-insulation",
    categoryName: "Insulation & Food Storage",
    image: "/demo/storage-rack.jpg",
    available: 22,
    specifications: { Tiers: "5", Material: "Steel" },
  },
];

function demoVariants(item: DemoProduct): ProductVariant[] {
  return (item.colours ?? []).map((colour) => ({
    id: `demo:${item.slug}:${colour.slug}`,
    sku: `${item.sku}-${colour.slug.toUpperCase()}`,
    name: colour.name,
    attributes: { color: colour.name, hex: colour.hex },
    priceOverride: null,
    isActive: true,
    onHand: Math.max(1, Math.floor(item.available / Math.max(item.colours?.length ?? 1, 1))),
    reserved: 0,
  }));
}

function toCard(item: DemoProduct): ProductCard {
  return {
    id: `demo:${item.slug}`,
    slug: item.slug,
    name: item.name,
    sku: item.sku,
    price: item.price,
    salePrice: item.salePrice ?? null,
    currency: "GHS",
    isNew: Boolean(item.isNew),
    isFeatured: Boolean(item.featured),
    isActive: true,
    categorySlug: item.categorySlug,
    categoryName: item.categoryName,
    available: item.available,
    colors: colorsFromVariants(demoVariants(item)),
    reviewCount: 0,
    ratingAverage: null,
    primaryImage: {
      id: `${item.slug}-img`,
      url: item.image,
      alt: `${item.name} (demo photograph)`,
      isPrimary: true,
      storageKey: item.image,
    },
  };
}

function toDetail(item: DemoProduct): ProductDetail {
  const card = toCard(item);
  return {
    ...card,
    description: item.description,
    specifications: item.specifications,
    categoryId: null,
    hasVariants: (item.colours?.length ?? 0) > 0,
    seoTitle: `${item.name} (demo)`,
    seoDescription: item.description.slice(0, 160),
    images: card.primaryImage ? [card.primaryImage] : [],
    variants: demoVariants(item),
    lowStockThreshold: 3,
    isActive: true,
  };
}

export const demoProductCards: ProductCard[] = demos.map(toCard);

export function getDemoProduct(slug: string): ProductDetail | null {
  const item = demos.find((entry) => entry.slug === slug);
  return item ? toDetail(item) : null;
}

export function filterDemoProducts(filters: {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "featured";
  featured?: boolean;
  isNew?: boolean;
  onSale?: boolean;
}): ProductCard[] {
  let items = demoProductCards.slice();
  const amount = (p: ProductCard) => Number(p.salePrice ?? p.price);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (filters.category) items = items.filter((p) => p.categorySlug === filters.category);
  if (filters.minPrice != null) items = items.filter((p) => amount(p) >= filters.minPrice!);
  if (filters.maxPrice != null) items = items.filter((p) => amount(p) <= filters.maxPrice!);
  if (filters.inStock) items = items.filter((p) => p.available > 0);
  if (filters.featured) items = items.filter((p) => p.isFeatured);
  if (filters.isNew) items = items.filter((p) => p.isNew);
  if (filters.onSale) {
    items = items.filter((p) => p.salePrice != null && Number(p.salePrice) < Number(p.price));
    items.sort((a, b) => amount(a) / Number(a.price) - amount(b) / Number(b.price));
  }
  if (filters.sort === "price_asc") items.sort((a, b) => amount(a) - amount(b));
  if (filters.sort === "price_desc") items.sort((a, b) => amount(b) - amount(a));
  if (filters.sort === "featured") items.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  return items;
}
