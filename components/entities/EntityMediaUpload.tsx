"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function EntityMediaUpload({
  slug,
  citySlug,
  mediaUrls,
  setMediaUrls,
}: {
  slug: string;
  citySlug: string;
  mediaUrls: string[];
  setMediaUrls: (urls: string[]) => void;
}) {
  const supabase = createBrowserClient();

  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file || !slug) return;

      const filePath = `entities/${slug}/media/${Date.now()}-${file.name}`;

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

      setMediaUrls([...mediaUrls, publicUrlData.publicUrl]);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="font-semibold">Additional Media</label>

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

      <div className="space-y-2 mt-2">
        {mediaUrls.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <img
              src={url}
              alt={`Media ${idx}`}
              className="w-32 h-32 object-cover rounded border"
            />
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() =>
                setMediaUrls(mediaUrls.filter((_, i) => i !== idx))
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
