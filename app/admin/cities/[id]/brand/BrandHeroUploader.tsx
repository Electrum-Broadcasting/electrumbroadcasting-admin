"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type BrandHero = {
  hero_image_url?: string;
  hero_image_path?: string;
};

type BrandState = {
  hero?: BrandHero;
  [key: string]: unknown;
};

export default function BrandHeroUploader({
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

  // Load existing hero metadata
  useEffect(() => {
    async function loadHero() {
      const res = await fetch(`/api/admin/settings/brand?cityId=${cityId}`);
      const data = await res.json();

      if (data?.hero_image_url || data?.hero_image_path) {
        setState((prev) => ({
          ...prev,
          hero: {
            hero_image_url: data.hero_image_url,
            hero_image_path: data.hero_image_path,
          },
        }));
      }
    }
    loadHero();
  }, [cityId, setState]);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const filePath = `cities/${cityId}/brand/hero-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("universal-media")
      .upload(filePath, file);

    if (error) {
      console.error("Hero upload error:", error);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("universal-media")
      .getPublicUrl(filePath);

    // Update unified brand state
    setState((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        hero_image_url: publicUrlData.publicUrl,
        hero_image_path: filePath,
      },
    }));

    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">City Hero Image</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />

      {state.hero?.hero_image_url && (
        <img
          src={state.hero.hero_image_url}
          alt="City Hero"
          className="mt-4 rounded border max-h-60"
        />
      )}
    </div>
  );
}
