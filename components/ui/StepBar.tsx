import { cn } from "@/lib/utils";

interface StepBarProps {
  steps: string[];
  current: number;
}

export default function StepBar({ steps, current }: StepBarProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                i <= current
                  ? "bg-sage text-white"
                  : "bg-muted text-gray-500"
              )}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className={cn("text-xs whitespace-nowrap", i <= current ? "text-sage-dark font-medium" : "text-gray-500")}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("flex-1 h-0.5 mx-2", i < current ? "bg-sage" : "bg-muted")} />
          )}
        </div>
      ))}
    </div>
  );
}
