"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type BrandLogo = {
  asset_id?: string;
  alt_text?: string;
  padding?: number;
  variant?: string;
  url?: string;
};

type BrandState = {
  logo?: BrandLogo;
  [key: string]: unknown;
};

export default function BrandLogoUploader({
  cityId,
  state,
  setState,
}: {
  cityId: string;
  state: BrandState;
  setState: React.Dispatch<React.SetStateAction<BrandState>>;
}) {
  const supabase = createClientComponentClient();
  const [uploading, setUploading] = useState(false);

  // Load existing logo metadata
  useEffect(() => {
    async function loadLogo() {
      const res = await fetch(`/api/admin/settings/brand?cityId=${cityId}`);
      const data = await res.json();

      if (data?.logo) {
        setState((prev) => ({
          ...prev,
          logo: {
            asset_id: data.logo.asset_id,
            alt_text: data.logo.alt_text,
            padding: data.logo.padding,
            variant: data.logo.variant,
            url: data.logo.url,
          },
        }));
      }
    }
    loadLogo();
  }, [cityId, setState]);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const filePath = `cities/${cityId}/brand/logo-${Date.now()}.png`;

    const { error } = await supabase.storage
      .from("universal-media")
      .upload(filePath, file);

    if (error) {
      console.error("Logo upload error:", error);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("universal-media")
      .getPublicUrl(filePath);

    setState((prev) => ({
      ...prev,
      logo: {
        ...prev.logo,
        asset_id: filePath,
        url: publicUrlData.publicUrl,
      },
    }));

    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">City Logo</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />

      {state.logo?.url && (
        <img
          src={state.logo.url}
          alt={state.logo.alt_text || "City Logo"}
          className="h-20 mt-4 rounded border"
        />
      )}

      <div>
        <label>Alt Text</label>
        <input
          type="text"
          value={state.logo?.alt_text || ""}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              logo: {
                ...prev.logo,
                alt_text: e.target.value,
              },
            }))
          }
        />
      </div>

      <div>
        <label>Padding</label>
        <input
          type="number"
          value={state.logo?.padding || 0}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              logo: {
                ...prev.logo,
                padding: parseInt(e.target.value, 10) || 0,
              },
            }))
          }
        />
      </div>

      <div>
        <label>Variant</label>
        <select
          value={state.logo?.variant || "default"}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              logo: {
                ...prev.logo,
                variant: e.target.value,
              },
            }))
          }
        >
          <option value="default">Default</option>
          <option value="horizontal">Horizontal</option>
          <option value="stacked">Stacked</option>
        </select>
      </div>
    </div>
  );
}
