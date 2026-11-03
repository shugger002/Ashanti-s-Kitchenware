import type { LucideIcon } from "lucide-react";
import {
  Blender,
  Box,
  CookingPot,
  House,
  Layers,
  LayoutGrid,
  PackageCheck,
  Percent,
  Soup,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react";

const BY_SLUG: Record<string, LucideIcon> = {
  cookware: CookingPot,
  "cookware-sets": Layers,
  "soup-pots": Soup,
  "cooking-pots": CookingPot,
  "kitchen-appliances": Blender,
  tableware: UtensilsCrossed,
  "storage-insulation": Box,
  "home-essentials": House,
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
