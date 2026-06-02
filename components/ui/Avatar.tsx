import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-16 w-16 text-lg",
} as const;

const palette = [
  "bg-primary/15 text-primary",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
  "bg-info/15 text-info",
  "bg-danger/15 text-danger",
  "bg-secondary text-secondary-foreground",
];

function colorFor(name: string): string {
  const sum = [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return palette[sum % palette.length]!;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 select-none",
        sizes[size],
        colorFor(name),
        className,
      )}
      aria-label={name}
    >
      {initials(name) || "?"}
    </div>
  );
}
