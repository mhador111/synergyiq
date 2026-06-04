import { cn } from "@/lib/utils/cn";

export interface ProgressProps {
  value: number; // 0-100
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
}

export function Progress({ value, className, indicatorClassName, showLabel = false }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full bg-primary transition-[width] duration-500 ease-out", indicatorClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-muted-foreground text-right">{clamped}%</div>
      )}
    </div>
  );
}
