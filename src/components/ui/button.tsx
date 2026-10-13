import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-sm px-5 py-3 text-sm font-medium tracking-wide transition-[background-color,color,border-color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-accent text-white hover:bg-accent-hover",
    variant === "secondary" && "border border-border bg-surface text-foreground hover:bg-background",
    variant === "ghost" && "text-foreground hover:bg-background",
    className,
  );
}

export function Button({ className, variant = "primary", type = "button", ...props }: Props) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
