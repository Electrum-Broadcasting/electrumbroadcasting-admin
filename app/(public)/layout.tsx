import { getBrandSettings } from "@/lib/settings/getBrandSettings";
import type { ReactNode } from "react";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const brand = await getBrandSettings();

  return (
    <div>
      <header className="flex items-center justify-center py-10">
        {brand.logo_asset_id ? (
          <img
            src={`/api/assets/${brand.logo_asset_id}`}
            alt="Electrum Logo"
            width={120}
            height={40}
          />
        ) : (
          <h1 className="text-primary text-4xl font-bold">Electrum</h1>
        )}
      </header>

      {children}
    </div>
  );
}
