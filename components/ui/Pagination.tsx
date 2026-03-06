"use client";

import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const visiblePages = pages.filter((p) => {
    if (totalPages <= 7) return true;
    if (p === 1 || p === totalPages) return true;
    if (Math.abs(p - currentPage) <= 1) return true;
    return false;
  });

  const withEllipsis: (number | "...")[] = [];
  for (let i = 0; i < visiblePages.length; i++) {
    if (i > 0 && visiblePages[i] - visiblePages[i - 1] > 1) {
      withEllipsis.push("...");
    }
    withEllipsis.push(visiblePages[i]);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-2 text-sm rounded-lg text-gray-500 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        ‹
      </button>
      {withEllipsis.map((item, i) =>
        item === "..." ? (
          <span key={`e${i}`} className="px-2 py-2 text-sm text-gray-500">...</span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={cn(
              "w-9 h-9 flex items-center justify-center text-sm rounded-lg transition-colors cursor-pointer",
              currentPage === item
                ? "bg-sage text-white font-semibold"
                : "text-gray-500 hover:bg-muted"
            )}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-2 text-sm rounded-lg text-gray-500 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        ›
      </button>
    </div>
  );
}
