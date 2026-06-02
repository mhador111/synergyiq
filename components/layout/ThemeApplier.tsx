"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/lib/redux/store";

export function ThemeApplier() {
  const theme = useAppSelector((s) => s.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  return null;
}
