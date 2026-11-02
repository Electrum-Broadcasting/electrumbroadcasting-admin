"use client";

import type { ReactNode } from "react";
import { useState } from "react";

const SECTIONS = [
  { id: "system", label: "System Preferences" },
  { id: "brand", label: "Brand & Theme Defaults" },
  { id: "safety", label: "Safety Defaults" },
  { id: "features", label: "Feature Toggles" },
  { id: "permissions", label: "Permissions" },
  { id: "content", label: "Content" },
];

type SettingsSectionId = (typeof SECTIONS)[number]["id"];

export default function SettingsLayout({
  children,
}: {
  children: (active: SettingsSectionId) => ReactNode;
}) {
  const [active, setActive] = useState<SettingsSectionId>("system");

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <aside className="h-fit shrink-0 rounded-lg border border-border bg-card p-4 shadow-sm lg:sticky lg:top-6 lg:w-64">
        <h2 className="mb-3 text-base font-semibold tracking-tight">CEO Settings</h2>
        <nav aria-label="Platform settings" className="flex gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              aria-current={active === s.id ? "page" : undefined}
              className={`block shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full ${
                active === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">{children(active)}</main>
    </div>
  );
}
