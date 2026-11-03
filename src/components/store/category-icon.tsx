import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Blender,
  Box,
  CookingPot,
  CupSoda,
  Droplets,
  Fan,
  House,
  Layers,
  LayoutGrid,
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

const BY_SLUG: Record<string, LucideIcon> = {
  cookware: CookingPot,
  "cookware-sets": Layers,
  "soup-pots": Soup,
  "cooking-pots": CookingPot,
  "kitchen-appliances": Blender,
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
