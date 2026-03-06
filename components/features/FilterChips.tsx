"use client";

import { cn } from "@/lib/utils";

interface FilterChipsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function FilterChips({ options, selected, onChange }: FilterChipsProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => toggle(option)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
            selected.includes(option)
              ? "bg-sage text-white"
              : "bg-muted text-gray-500 hover:bg-sage/10 hover:text-sage-dark"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
