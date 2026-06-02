import { format, formatDistanceToNow, isPast, isToday, isThisWeek, differenceInDays } from "date-fns";

export function formatDate(d: Date | string | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, pattern);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  return formatDate(d, "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function isOverdue(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  const date = typeof d === "string" ? new Date(d) : d;
  return isPast(date) && !isToday(date);
}

export function isUpcoming(d: Date | string | null | undefined, withinDays = 7): boolean {
  if (!d) return false;
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = differenceInDays(date, new Date());
  return diff >= 0 && diff <= withinDays;
}

export function isDueThisWeek(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  const date = typeof d === "string" ? new Date(d) : d;
  return isThisWeek(date, { weekStartsOn: 1 });
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
