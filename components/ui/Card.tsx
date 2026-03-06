import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingStyles = { sm: "p-3", md: "p-5", lg: "p-6" };

export default function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-[var(--radius-card)] border border-muted",
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
