"use client";

import { useEffect, useState } from "react";

export default function BrandChildSafetyEditor({ cityId }: { cityId: string }) {
  const [childSafety, setChildSafety] = useState({
    enable_age_filtering: false,
    hide_sensitive_images: true,
    restrict_video_autoplay: true,
    require_safe_search: true,
  });

  // Load child safety settings
  useEffect(() => {
    async function loadChildSafety() {
      const res = await fetch(
        `/api/admin/settings/brand/child-safety?cityId=${cityId}`
      );
      const data = await res.json();

      if (data) {
        setChildSafety({
          enable_age_filtering: data.enable_age_filtering ?? false,
          hide_sensitive_images: data.hide_sensitive_images ?? true,
          restrict_video_autoplay: data.restrict_video_autoplay ?? true,
          require_safe_search: data.require_safe_search ?? true,
        });
      }
    }

    loadChildSafety();
  }, [cityId]);

  // Save child safety settings
  async function handleSave() {
    await fetch("/api/admin/settings/brand/child-safety", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId,
        child_safety: childSafety,
      }),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Child Safety Settings</h2>

      <div>
        <label>Enable Age Filtering</label>
        <input
          type="checkbox"
          checked={childSafety.enable_age_filtering}
          onChange={(e) =>
            setChildSafety({
              ...childSafety,
              enable_age_filtering: e.target.checked,
            })
          }
        />
      </div>

      <div>
        <label>Hide Sensitive Images</label>
        <input
          type="checkbox"
          checked={childSafety.hide_sensitive_images}
          onChange={(e) =>
            setChildSafety({
              ...childSafety,
              hide_sensitive_images: e.target.checked,
            })
          }
        />
      </div>

      <div>
        <label>Restrict Video Autoplay</label>
        <input
          type="checkbox"
          checked={childSafety.restrict_video_autoplay}
          onChange={(e) =>
            setChildSafety({
              ...childSafety,
              restrict_video_autoplay: e.target.checked,
            })
          }
        />
      </div>

      <div>
        <label>Require Safe Search</label>
        <input
          type="checkbox"
          checked={childSafety.require_safe_search}
          onChange={(e) =>
            setChildSafety({
              ...childSafety,
              require_safe_search: e.target.checked,
            })
          }
        />
      </div>

      <button onClick={handleSave}>Save Child Safety</button>
    </div>
  );
}