"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--surface-elevated)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          fontSize: "0.875rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        },
        success: { iconTheme: { primary: "var(--success)", secondary: "#fff" } },
        error: { iconTheme: { primary: "var(--danger)", secondary: "#fff" } },
      }}
    />
  );
}
