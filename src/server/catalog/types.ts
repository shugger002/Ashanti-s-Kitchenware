export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
};

export type ProductImage = {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  storageKey: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  priceOverride: string | null;
  isActive: boolean;
  onHand: number;
  reserved: number;
};

export type ProductColorOption = {
  variantId: string;
  name: string;
  hex: string;
};

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  price: string;
  salePrice: string | null;
  currency: string;
  primaryImage: ProductImage | null;
  available: number;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  colors: ProductColorOption[];
  reviewCount: number;
  ratingAverage: number | null;
};

export type ProductDetail = ProductCard & {
  description: string;
  specifications: Record<string, string>;
  categoryId: string | null;
  hasVariants: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  lowStockThreshold: number;
  isActive: boolean;
};
