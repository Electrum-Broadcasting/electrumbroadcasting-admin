"use client";

import { useEffect, useState } from "react";

export default function BrandTypographyEditor({ cityId }: { cityId: string }) {
  const [typography, setTypography] = useState({
    heading_font: "",
    body_font: "",
    scale_ratio: 1.25,
  });

  // Load existing typography settings
  useEffect(() => {
    async function loadTypography() {
      const res = await fetch(
        `/api/admin/settings/brand/typography?cityId=${cityId}`
      );
      const data = await res.json();

      if (data) {
        setTypography({
          heading_font: data.heading_font ?? "",
          body_font: data.body_font ?? "",
          scale_ratio: data.scale_ratio ?? 1.25,
        });
      }
    }

    loadTypography();
  }, [cityId]);

  // Save updated typography settings
  async function handleSave() {
    await fetch("/api/admin/settings/brand/typography", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId,
        typography,
      }),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Typography Settings</h2>

      <div>
        <label>Heading Font</label>
        <input
          type="text"
          value={typography.heading_font}
          onChange={(e) =>
            setTypography({ ...typography, heading_font: e.target.value })
          }
        />
      </div>

      <div>
        <label>Body Font</label>
        <input
          type="text"
          value={typography.body_font}
          onChange={(e) =>
            setTypography({ ...typography, body_font: e.target.value })
          }
        />
      </div>

      <div>
        <label>Scale Ratio</label>
        <input
          type="number"
          step="0.01"
          value={typography.scale_ratio}
          onChange={(e) =>
            setTypography({
              ...typography,
              scale_ratio: parseFloat(e.target.value),
            })
          }
        />
      </div>

      <button onClick={handleSave}>Save Typography</button>
    </div>
  );
}