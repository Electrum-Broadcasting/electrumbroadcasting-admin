"use client";

import { useEffect, useState } from "react";

export default function BrandLogoUploader({ cityId }: { cityId: string }) {
  const [logo, setLogo] = useState({
    asset_id: "",
    alt_text: "",
    padding: 0,
    variant: "default",
  });

  const [file, setFile] = useState<File | null>(null);

  // Load existing logo settings
  useEffect(() => {
    async function loadLogo() {
      const res = await fetch(
        `/api/admin/settings/brand/logo?cityId=${cityId}`
      );
      const data = await res.json();

      if (data) {
        setLogo({
          asset_id: data.asset_id ?? "",
          alt_text: data.alt_text ?? "",
          padding: data.padding ?? 0,
          variant: data.variant ?? "default",
        });
      }
    }

    loadLogo();
  }, [cityId]);

  // Upload file to Supabase Storage
  async function uploadFile() {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/assets/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.asset_id; // returned by your upload route
  }

  // Save logo settings
  async function handleSave() {
    let assetId = logo.asset_id;

    if (file) {
      const uploadedId = await uploadFile();
      if (uploadedId) {
        assetId = uploadedId;
      }
    }

    await fetch("/api/admin/settings/brand/logo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId,
        logo: {
          ...logo,
          asset_id: assetId,
        },
      }),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">City Logo</h2>

      <div>
        <label>Upload Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label>Alt Text</label>
        <input
          type="text"
          value={logo.alt_text}
          onChange={(e) => setLogo({ ...logo, alt_text: e.target.value })}
        />
      </div>

      <div>
        <label>Padding</label>
        <input
          type="number"
          value={logo.padding}
          onChange={(e) => setLogo({ ...logo, padding: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <label>Variant</label>
        <select
          value={logo.variant}
          onChange={(e) => setLogo({ ...logo, variant: e.target.value })}
        >
          <option value="default">Default</option>
          <option value="horizontal">Horizontal</option>
          <option value="stacked">Stacked</option>
        </select>
      </div>

      <button onClick={handleSave}>Save Logo</button>
    </div>
  );
}