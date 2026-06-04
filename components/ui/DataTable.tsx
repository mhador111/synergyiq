"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { Input } from "./Input";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "./Skeleton";

export interface Column<T> {
  key: string;
  header: string;
  /** When omitted, the cell is rendered as a string. */
  render?: (row: T) => ReactNode;
  /** Accessor for sorting and filtering. */
  accessor?: (row: T) => string | number | null | undefined;
  /** Allow sorting by this column. Defaults to true. */
  sortable?: boolean;
  /** Tailwind className applied to <td>. */
  className?: string;
  /** Tailwind className applied to <th>. */
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[] | undefined;
  columns: Column<T>[];
  /** Unique key for each row. */
  rowKey: (row: T) => string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  /** Glob-style filter against this combined string. */
  globalFilter?: (row: T, term: string) => boolean;
  /** Rendered as a leading column. */
  leadingColumn?: {
    header?: string;
    render: (row: T) => ReactNode;
    className?: string;
  };
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
  };
  /** Optional toolbar rendered above the table. */
  toolbar?: ReactNode;
  /** Striped/hover styles toggle. */
  hover?: boolean;
  className?: string;
}

type SortDir = "asc" | "desc" | null;

export function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading,
  searchPlaceholder = "Search…",
  globalFilter,
  leadingColumn,
  emptyState,
  toolbar,
  hover = true,
  className,
}: DataTableProps<T>) {
  const [term, setTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!term) return data;
    return data.filter((row) =>
      globalFilter
        ? globalFilter(row, term.toLowerCase())
        : columns.some((c) => {
            const v = c.accessor ? c.accessor(row) : (row as Record<string, unknown>)[c.key];
            return v != null && String(v).toLowerCase().includes(term);
          }),
    );
  }, [data, term, globalFilter, columns]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const acc = col.accessor ?? ((row: T) => (row as Record<string, unknown>)[col.key] as string | number | null | undefined);
    const copy = [...filtered].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return sortDir === "asc" ? copy : copy.reverse();
  }, [filtered, sortKey, sortDir, columns]);

  function onHeaderClick(col: Column<T>) {
    if (col.sortable === false) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") setSortDir("desc");
    else if (sortDir === "desc") {
      setSortKey(null);
      setSortDir(null);
    } else setSortDir("asc");
  }

  return (
    <div className={cn("rounded-xl border border-border bg-surface-elevated overflow-hidden", className)}>
      <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center gap-2">
        {globalFilter || !toolbar ? (
          <div className="relative sm:max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        ) : null}
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {leadingColumn && <th className={cn("px-4 py-2.5 text-left font-semibold text-muted-foreground w-2", leadingColumn.className)} />}
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-2.5 text-left font-semibold text-muted-foreground select-none",
                      col.sortable !== false && "cursor-pointer hover:text-foreground transition-colors",
                      col.headerClassName,
                    )}
                    onClick={() => onHeaderClick(col)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {isSorted && (sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`s-${i}`}>
                  <td colSpan={columns.length + (leadingColumn ? 1 : 0)} className="px-4 py-3">
                    <Skeleton className="h-9 w-full" />
                  </td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (leadingColumn ? 1 : 0)} className="px-4 py-2">
                  {emptyState ? (
                    <EmptyState
                      icon={emptyState.icon}
                      title={emptyState.title}
                      description={emptyState.description}
                      action={emptyState.action}
                      className="border-0 bg-transparent"
                    />
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">No results.</div>
                  )}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(hover && "hover:bg-muted/50 transition-colors")}
                >
                  {leadingColumn && <td className={cn("px-4 py-3", leadingColumn.className)}>{leadingColumn.render(row)}</td>}
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-foreground", col.className)}>
                      {col.render
                        ? col.render(row)
                        : col.accessor
                          ? (col.accessor(row) as ReactNode)
                          : ((row as Record<string, ReactNode>)[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
