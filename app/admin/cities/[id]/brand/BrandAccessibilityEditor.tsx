"use client";

import { useEffect, useState } from "react";

export default function BrandAccessibilityEditor({ cityId }: { cityId: string }) {
  const [accessibility, setAccessibility] = useState({
    high_contrast_mode: false,
    min_font_size: 14,
    prefers_reduced_motion: false,
    link_underline: true,
  });

  // Load accessibility settings
  useEffect(() => {
    async function loadAccessibility() {
      const res = await fetch(
        `/api/admin/settings/brand/accessibility?cityId=${cityId}`
      );
      const data = await res.json();

      if (data) {
        setAccessibility({
          high_contrast_mode: data.high_contrast_mode ?? false,
          min_font_size: data.min_font_size ?? 14,
          prefers_reduced_motion: data.prefers_reduced_motion ?? false,
          link_underline: data.link_underline ?? true,
        });
      }
    }

    loadAccessibility();
  }, [cityId]);

  // Save accessibility settings
  async function handleSave() {
    await fetch("/api/admin/settings/brand/accessibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId,
        accessibility,
      }),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Settings</h2>

      <div>
        <label>High Contrast Mode</label>
        <input
          type="checkbox"
          checked={accessibility.high_contrast_mode}
          onChange={(e) =>
            setAccessibility({
              ...accessibility,
              high_contrast_mode: e.target.checked,
            })
          }
        />
      </div>

      <div>
        <label>Minimum Font Size (px)</label>
        <input
          type="number"
          value={accessibility.min_font_size}
          onChange={(e) =>
            setAccessibility({
              ...accessibility,
              min_font_size: parseInt(e.target.value),
            })
          }
        />
      </div>

      <div>
        <label>Prefers Reduced Motion</label>
        <input
          type="checkbox"
          checked={accessibility.prefers_reduced_motion}
          onChange={(e) =>
            setAccessibility({
              ...accessibility,
              prefers_reduced_motion: e.target.checked,
            })
          }
        />
      </div>

      <div>
        <label>Underline Links</label>
        <input
          type="checkbox"
          checked={accessibility.link_underline}
          onChange={(e) =>
            setAccessibility({
              ...accessibility,
              link_underline: e.target.checked,
            })
          }
        />
      </div>

      <button onClick={handleSave}>Save Accessibility</button>
    </div>
  );
}