import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Blender,
  Box,
  Citrus,
  Coffee,
  CookingPot,
  CupSoda,
  Droplets,
  Fan,
  Heater,
  House,
  Layers,
  LayoutGrid,
  Microwave,
  Package,
  PackageCheck,
  Percent,
  Rows3,
  Snowflake,
  Soup,
  Sparkles,
  Star,
  Umbrella,
  Utensils,
  UtensilsCrossed,
  Wind,
} from "lucide-react";

const NAV_NAME: Record<string, string> = {
  "kitchen-appliances": "Appliances",
  "storage-insulation": "Storage",
  "home-essentials": "Home",
};

export function categoryNavName(slug: string, name: string) {
  return NAV_NAME[slug] ?? name;
}

const BY_SLUG: Record<string, LucideIcon> = {
  cookware: CookingPot,
  "cookware-sets": Layers,
  "soup-pots": Soup,
  "cooking-pots": CookingPot,
  "kitchen-appliances": Blender,
  blenders: Blender,
  juicers: Citrus,
  "microwave-ovens": Microwave,
  kettles: Coffee,
  "food-warmers": Heater,
  "rice-cookers": Soup,
  tableware: UtensilsCrossed,
  cutlery: Utensils,
  drinkware: CupSoda,
  "storage-insulation": Box,
  "food-storage": Package,
  "cool-boxes": Snowflake,
  "shoe-racks": Rows3,
  "home-essentials": House,
  furniture: Armchair,
  "outdoor-shade": Umbrella,
  fans: Fan,
  "air-conditioners": Wind,
  "soap-dispensers": Droplets,
  all: LayoutGrid,
  new: Sparkles,
  featured: Star,
  sale: Percent,
  stock: PackageCheck,
};

export function CategoryGlyph({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Icon = BY_SLUG[slug] ?? LayoutGrid;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}
