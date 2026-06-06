import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/redux/StoreProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthHydrator } from "@/components/layout/AuthHydrator";
import { ThemeApplier } from "@/components/layout/ThemeApplier";
import { Toaster } from "@/components/ui/Toaster";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SynergyIQ — Smart Project & Task Collaboration",
  description: "Plan, ship, and track work with your team — all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply persisted theme before paint to avoid FOUC (light/dark flash). */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('synergyiq-theme');if(t==='light'||t==='dark'){document.documentElement.classList.toggle('dark',t==='dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <StoreProvider>
          <AuthProvider>
            <ThemeApplier />
            <AuthHydrator />
            {children}
            <Toaster />
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
