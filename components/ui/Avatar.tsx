import { cn } from "@/lib/utils";

interface AvatarProps {
  emoji: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

const sizeMap = { sm: "w-8 h-8 text-lg", md: "w-12 h-12 text-2xl", lg: "w-16 h-16 text-3xl" };

export default function Avatar({ emoji, size = "md", online, className }: AvatarProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center rounded-full bg-muted shrink-0", sizeMap[size], className)}>
      <span>{emoji}</span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
            online ? "bg-success" : "bg-gray-300"
          )}
        />
      )}
    </div>
  );
}
