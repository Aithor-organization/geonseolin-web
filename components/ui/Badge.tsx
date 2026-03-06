import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "sage" | "terracotta" | "muted" | "success" | "warning";
  className?: string;
}

const variantStyles = {
  sage: "bg-sage/10 text-sage-dark",
  terracotta: "bg-terracotta/10 text-terracotta-dark",
  muted: "bg-muted text-gray-500",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export default function Badge({ children, variant = "sage", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
