import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Electrum Broadcasting Admin",
  description: "Secure role-based administration for Electrum Broadcasting"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
