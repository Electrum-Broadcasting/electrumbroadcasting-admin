"use client";

import { createBrowserClient } from "@/lib/supabase/client";

export default function ThumbnailUpload({
  thumbnailUrl,
  setThumbnailUrl,
  citySlug,
  slug,
}: {
  thumbnailUrl: string;
  setThumbnailUrl: (url: string) => void;
  citySlug: string;
  slug: string;
}) {
  const supabase = createBrowserClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const filePath = `${citySlug}/entities/${slug}/thumbnail-${Date.now()}`;

    const { data, error } = await supabase.storage
      .from("entity-media")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      alert("Thumbnail upload failed");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("entity-media")
      .getPublicUrl(filePath);

    setThumbnailUrl(urlData.publicUrl);
  }

  return (
    <div className="space-y-2">
      <label className="font-semibold">Thumbnail</label>

      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt="Thumbnail"
          className="w-48 h-48 object-cover rounded border"
        />
      )}

      <input type="file" accept="image/*" onChange={handleUpload} />
    </div>
  );
}
