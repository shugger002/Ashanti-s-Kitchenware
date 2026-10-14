import { cn } from "@/lib/utils";

export function SalePriceBubble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent px-3.5 py-2 text-[1.25rem] font-bold leading-none text-white tabular-nums shadow-[0_8px_18px_rgba(200,16,46,0.38)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
