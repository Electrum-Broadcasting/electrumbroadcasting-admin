"use client";

import { useEffect } from "react";

type AccessibilitySettings = {
  high_contrast_mode?: boolean;
  min_font_size?: number;
  prefers_reduced_motion?: boolean;
  link_underline?: boolean;
};

type BrandState = {
  accessibility?: AccessibilitySettings;
  [key: string]: unknown;
};

export default function BrandAccessibilityEditor({
  cityId,
  state,
  setState,
}: {
  cityId: string;
  state: BrandState;
  setState: React.Dispatch<React.SetStateAction<BrandState>>;
}) {
  // Load accessibility settings into unified brand state
  useEffect(() => {
    async function loadAccessibility() {
      const res = await fetch(`/api/admin/settings/brand?cityId=${cityId}`);
      const data = await res.json();

      if (data?.accessibility) {
        setState((prev) => ({
          ...prev,
          accessibility: {
            high_contrast_mode: data.accessibility.high_contrast_mode ?? false,
            min_font_size: data.accessibility.min_font_size ?? 14,
            prefers_reduced_motion:
              data.accessibility.prefers_reduced_motion ?? false,
            link_underline: data.accessibility.link_underline ?? true,
          },
        }));
      }
    }

    loadAccessibility();
  }, [cityId, setState]);

  const accessibility = state.accessibility || {};

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Settings</h2>

      <div>
        <label>High Contrast Mode</label>
        <input
          type="checkbox"
          checked={accessibility.high_contrast_mode || false}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              accessibility: {
                ...prev.accessibility,
                high_contrast_mode: e.target.checked,
              },
            }))
          }
        />
      </div>

      <div>
        <label>Minimum Font Size (px)</label>
        <input
          type="number"
          value={accessibility.min_font_size || 14}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              accessibility: {
                ...prev.accessibility,
                min_font_size: parseInt(e.target.value, 10) || 14,
              },
            }))
          }
        />
      </div>

      <div>
        <label>Prefers Reduced Motion</label>
        <input
          type="checkbox"
          checked={accessibility.prefers_reduced_motion || false}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              accessibility: {
                ...prev.accessibility,
                prefers_reduced_motion: e.target.checked,
              },
            }))
          }
        />
      </div>

      <div>
        <label>Underline Links</label>
        <input
          type="checkbox"
          checked={accessibility.link_underline || false}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              accessibility: {
                ...prev.accessibility,
                link_underline: e.target.checked,
              },
            }))
          }
        />
      </div>
    </div>
  );
}
