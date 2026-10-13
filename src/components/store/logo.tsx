import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export function StoreLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.logoSrc}
      alt={brand.name}
      className={cn("h-9 w-auto object-contain object-left dark:invert", className)}
    />
  );
}
