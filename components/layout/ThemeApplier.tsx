"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setTheme, type Theme } from "@/lib/redux/slices/uiSlice";

const STORAGE_KEY = "synergyiq-theme";

/**
 * Applies the active theme to <html> and persists the user's choice to
 * localStorage. The no-flash inline script in app/layout.tsx reads the
 * same key on first paint so the right theme is applied before React
 * hydrates.
 */
export function ThemeApplier() {
  const theme = useAppSelector((s) => s.ui.theme);
  const dispatch = useAppDispatch();

  // On mount, hydrate the theme from localStorage (if present).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        if (stored !== theme) dispatch(setTheme(stored));
      }
    } catch {
      /* localStorage unavailable (private mode, SSR, etc.) — ignore */
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme class and persist on change.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return null;
}
