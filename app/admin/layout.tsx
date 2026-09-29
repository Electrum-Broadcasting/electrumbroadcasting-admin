import { ToastProvider } from "@/components/ui/ToastProvider";
import "@/app/globals.css"; // ensure global styles load
import type { ReactNode } from "react";
import { getBrandSettings } from "@/lib/settings/getBrandSettings";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const brand = await getBrandSettings();

  return (
    <html lang="en">
      <body
        className="min-h-screen"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        <main className="p-10">{children}</main>
      </body>
    </html>
  );
}