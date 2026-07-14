"use client";

import { useState } from "react";

const SECTIONS = [
  { id: "system", label: "System Preferences" },
  { id: "brand", label: "Brand & Theme Defaults" },
  { id: "safety", label: "Safety Defaults" },
  { id: "features", label: "Feature Toggles" },
  { id: "permissions", label: "Permissions" },
];

export default function SettingsLayout({ children }: { children: any }) {
  const [active, setActive] = useState("system");

  return (
    <div className="flex gap-6 p-6">
      {/* Left Navigation */}
      <aside className="w-64 border-r pr-4">
        <h2 className="text-lg font-semibold mb-4">CEO Settings</h2>

        <nav className="space-y-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`block w-full text-left px-3 py-2 rounded ${
                active === s.id
                  ? "bg-black text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Right Content */}
      <main className="flex-1">{children(active)}</main>
    </div>
  );
}
