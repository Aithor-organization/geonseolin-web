"use client";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeMap = { sm: "text-sm", md: "text-xl", lg: "text-3xl" };

export default function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <div className={cn("flex gap-0.5", sizeMap[size])}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            interactive && "cursor-pointer hover:scale-110 transition-transform",
            i < rating ? "text-warning" : "text-gray-300"
          )}
          onClick={() => interactive && onChange?.(i + 1)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
