"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  id,
  label = "Quantity",
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  id?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const ceiling = Math.max(min, max);
  const compact = size === "sm";
  function set(next: number) {
    onChange(Math.min(ceiling, Math.max(min, next)));
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border border-border bg-surface",
        compact ? "h-10" : "h-12",
      )}
    >
      <button
        type="button"
        className={cn(
          "flex items-center justify-center text-foreground disabled:opacity-40",
          compact ? "h-10 w-9" : "h-12 w-11",
        )}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => set(value - 1)}
      >
        <Minus className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={ceiling}
        aria-label={label}
        value={value}
        onChange={(event) => set(Number(event.target.value) || min)}
        className={cn(
          "border-x border-border bg-transparent text-center text-sm font-medium tabular-nums outline-none",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      />
      <button
        type="button"
        className={cn(
          "flex items-center justify-center text-foreground disabled:opacity-40",
          compact ? "h-10 w-9" : "h-12 w-11",
        )}
        aria-label={`Increase ${label}`}
        disabled={value >= ceiling}
        onClick={() => set(value + 1)}
      >
        <Plus className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
