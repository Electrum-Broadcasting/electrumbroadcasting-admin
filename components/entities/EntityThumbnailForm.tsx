"use client";

import React from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { removeImage } from "@/lib/storage/remove";

interface EntityThumbnailFormProps {
  thumbnailUrl: string | null;
  setThumbnailUrl: (v: string | null) => void;

  citySlug: string;
  slug: string;
}

export default function EntityThumbnailForm({
  thumbnailUrl,
  setThumbnailUrl,
  citySlug,
  slug,
}: EntityThumbnailFormProps) {
  const supabase = createBrowserClient();

  async function uploadThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const filename = `thumbnail.${ext}`;
    const path = `${citySlug}/entities/${slug}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("entity-thumbnails")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert("Thumbnail upload failed.");
      return;
    }

    const { data } = supabase.storage
      .from("entity-thumbnails")
      .getPublicUrl(path);

    setThumbnailUrl(data.publicUrl);
  }

  async function handleRemove() {
    if (!thumbnailUrl) return;

    const confirmed = confirm("Remove thumbnail?");
    if (!confirmed) return;

    const path = thumbnailUrl.split("/").slice(-3).join("/");

    const { error } = await removeImage(
      supabase,
      "entity-thumbnails",
      path
    );

    if (error) {
      alert("Failed to remove thumbnail.");
      return;
    }

    setThumbnailUrl(null);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Thumbnail</h2>

      <p className="text-xs text-gray-500">
        Recommended size: 600×600. JPG or PNG. Max 5MB.
      </p>

      <input
        type="file"
        accept="image/*"
        className="w-full border p-2 rounded"
        onChange={uploadThumbnail}
      />

      {thumbnailUrl && (
        <div className="space-y-2">
          <img
            src={thumbnailUrl}
            className="w-48 h-48 object-cover rounded border"
          />

          <button
            type="button"
            onClick={handleRemove}
            className="text-red-600 text-sm underline"
          >
            Remove thumbnail
          </button>
        </div>
      )}
    </section>
  );
}
