import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  average,
  count,
  compact = false,
}: {
  average: number | null;
  count: number;
  compact?: boolean;
}) {
  if (!count || average == null) return null;
  const rounded = Math.round(average * 10) / 10;
  const label = `${rounded.toFixed(1)} out of 5 from ${count} published ${count === 1 ? "review" : "reviews"}`;

  return (
    <p className={cn("flex items-center gap-1.5 text-sm", compact && "text-xs")} aria-label={label}>
      <span className="flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.min(1, Math.max(0, rounded - index));
          return (
            <span key={index} className="relative h-3.5 w-3.5">
              <Star className="absolute inset-0 h-3.5 w-3.5 text-border" strokeWidth={1.5} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="h-3.5 w-3.5 fill-accent text-accent" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </span>
      <span>
        {rounded.toFixed(1)}
        {compact ? null : (
          <span className="text-muted">
            {" "}
            ({count})
          </span>
        )}
      </span>
    </p>
  );
}
