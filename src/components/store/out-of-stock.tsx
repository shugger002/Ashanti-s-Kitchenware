import { cn } from "@/lib/utils";

export function outOfStockImageClass(className?: string) {
  return cn(
    "h-full w-full scale-[1.08] object-cover blur-[8px] brightness-[1.12] saturate-[0.55]",
    className,
  );
}

export function OutOfStockOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center bg-white/40"
      aria-hidden
    >
      <span
        className={cn(
          "rounded-full bg-[#16181d] font-medium tracking-wide text-white shadow-[0_10px_28px_rgba(15,18,24,0.38)]",
          compact
            ? "px-2.5 py-1 text-[10px]"
            : "px-5 py-2.5 text-[13px] group-data-[layout=list]/catalog:px-2.5 group-data-[layout=list]/catalog:py-1 group-data-[layout=list]/catalog:text-[10px] sm:px-6 sm:py-2.5 sm:text-sm",
        )}
      >
        Out of Stock
      </span>
    </span>
  );
}
