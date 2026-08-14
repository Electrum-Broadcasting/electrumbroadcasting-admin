"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function EntityHeroImageUpload({
  slug,
  citySlug,
  heroImageUrl,
  setHeroImageUrl,
}: {
  slug: string;
  citySlug: string;
  heroImageUrl: string;
  setHeroImageUrl: (url: string) => void;
}) {
  const supabase = createBrowserClient();

  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file || !slug) return;

      const filePath = `entities/${slug}/hero-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from("universal-media")
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error(error);
        alert("Upload failed.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("universal-media")
        .getPublicUrl(filePath);

      setHeroImageUrl(publicUrlData.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="font-semibold">Hero Image</label>

      {heroImageUrl && (
        <img
          src={heroImageUrl}
          alt="Hero"
          className="w-full max-w-xl rounded border"
        />
      )}

      {heroImageUrl && (
        <button
          className="bg-red-600 text-white px-3 py-1 rounded"
          onClick={() => setHeroImageUrl("")}
        >
          Remove
        </button>
      )}

      <input
        type="file"
        accept="image/*"
        disabled={!slug || uploading}
        onChange={handleUpload}
        className="border p-2 w-full"
      />

      {!slug && (
        <div className="text-sm text-red-600">
          Enter a slug before uploading media.
        </div>
      )}
    </div>
  );
}
