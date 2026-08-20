"use client";

import { useEffect } from "react";

type ChildSafetySettings = {
  enable_age_filtering?: boolean;
  hide_sensitive_images?: boolean;
  restrict_video_autoplay?: boolean;
  require_safe_search?: boolean;
};

type BrandState = {
  child_safety?: ChildSafetySettings;
  [key: string]: unknown;
};

export default function BrandChildSafetyEditor({
  cityId,
  state,
  setState,
}: {
  cityId: string;
  state: BrandState;
  setState: React.Dispatch<React.SetStateAction<BrandState>>;
}) {
  // Load child safety settings into unified brand state
  useEffect(() => {
    async function loadChildSafety() {
      const res = await fetch(`/api/admin/settings/brand?cityId=${cityId}`);
      const data = await res.json();

      if (data?.child_safety) {
        setState((prev) => ({
          ...prev,
          child_safety: {
            enable_age_filtering:
              data.child_safety.enable_age_filtering ?? false,
            hide_sensitive_images:
              data.child_safety.hide_sensitive_images ?? true,
            restrict_video_autoplay:
              data.child_safety.restrict_video_autoplay ?? true,
            require_safe_search:
              data.child_safety.require_safe_search ?? true,
          },
        }));
      }
    }

    loadChildSafety();
  }, [cityId, setState]);

  const childSafety = state.child_safety || {};

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Child Safety Settings</h2>

      <div>
        <label>Enable Age Filtering</label>
        <input
          type="checkbox"
          checked={childSafety.enable_age_filtering || false}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              child_safety: {
                ...prev.child_safety,
                enable_age_filtering: e.target.checked,
              },
            }))
          }
        />
      </div>

      <div>
        <label>Hide Sensitive Images</label>
        <input
          type="checkbox"
          checked={childSafety.hide_sensitive_images || false}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              child_safety: {
                ...prev.child_safety,
                hide_sensitive_images: e.target.checked,
              },
            }))
          }
        />
      </div>

      <div>
        <label>Restrict Video Autoplay</label>
        <input
          type="checkbox"
          checked={childSafety.restrict_video_autoplay || false}
          onChange={(e) =>
            setState((prev) => ({
              ...prev.child_safety,
              child_safety: {
                ...prev.child_safety,
                restrict_video_autoplay: e.target.checked,
              },
            }))
          }
        />
      </div>

      <div>
        <label>Require Safe Search</label>
        <input
          type="checkbox"
          checked={childSafety.require_safe_search || false}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              child_safety: {
                ...prev.child_safety,
                require_safe_search: e.target.checked,
              },
            }))
          }
        />
      </div>
    </div>
  );
}
