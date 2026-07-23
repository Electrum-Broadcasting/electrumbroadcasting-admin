"use client";

import { useEffect, useState } from "react";

export default function BrandPaletteEditor({ cityId }: { cityId: string }) {
  const [palette, setPalette] = useState({
    accent_color: "#000000",
    accent_color_secondary: "#ffffff",
  });

  useEffect(() => {
    async function loadPalette() {
      const res = await fetch(
        `/api/admin/settings/brand/palette?cityId=${cityId}`
      );
      const data = await res.json();

      if (data) {
        setPalette({
          accent_color: data.accent_color ?? "#000000",
          accent_color_secondary: data.accent_color_secondary ?? "#ffffff",
        });
      }
    }

    loadPalette();
  }, [cityId]);

  async function handleSave() {
    await fetch("/api/admin/settings/brand/palette", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId,
        accent_color: palette.accent_color,
        accent_color_secondary: palette.accent_color_secondary,
      }),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Palette Settings</h2>

      <div>
        <label>Primary Accent</label>
        <input
          type="color"
          value={palette.accent_color}
          onChange={(e) =>
            setPalette({ ...palette, accent_color: e.target.value })
          }
        />
      </div>

      <div>
        <label>Secondary Accent</label>
        <input
          type="color"
          value={palette.accent_color_secondary}
          onChange={(e) =>
            setPalette({ ...palette, accent_color_secondary: e.target.value })
          }
        />
      </div>

      <button onClick={handleSave}>Save Palette</button>
    </div>
  );
}