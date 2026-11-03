import type { LucideIcon } from "lucide-react";
import {
  Blender,
  Box,
  CookingPot,
  House,
  LayoutGrid,
  PackageCheck,
  Percent,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react";

const BY_SLUG: Record<string, LucideIcon> = {
  cookware: CookingPot,
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
