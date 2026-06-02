"use client";

import { Moon, Sun } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setTheme, toggleTheme } from "@/lib/redux/slices/uiSlice";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button aria-label="Toggle theme" className="h-9 w-9 rounded-lg border border-border bg-surface-elevated flex items-center justify-center">
        <span className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => dispatch(toggleTheme())}
      className="h-9 w-9 rounded-lg border border-border bg-surface-elevated flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
