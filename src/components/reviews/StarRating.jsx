import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

export default function StarRating({ value = 0, onChange, size = "md", className }) {
  const interactive = typeof onChange === "function";
  const filled = Math.round(Number(value) || 0);
  const iconSize = SIZES[size] || SIZES.md;

  if (!interactive) {
    return (
      <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(iconSize, star <= filled ? "fill-accent text-accent" : "text-muted-foreground/30")}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          className="transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <Star
            className={cn(iconSize, star <= filled ? "fill-accent text-accent" : "text-muted-foreground/40")}
          />
        </button>
      ))}
    </div>
  );
}