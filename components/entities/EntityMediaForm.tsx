"use client";

console.log("Rendering EntityMediaForm");

import React from "react";

interface EntityMediaFormProps {
  heroImageUrl: string;
  setHeroImageUrl: (v: string) => void;

  hero360Url: string;
  setHero360Url: (v: string) => void;

  mediaUrls: string[];
  setMediaUrls: (v: string[]) => void;

  citySlug: string;
  slug: string;
}

export default function EntityMediaForm({
  heroImageUrl,
  setHeroImageUrl,
  hero360Url,
  setHero360Url,
  mediaUrls,
  setMediaUrls,
  citySlug,
  slug,
}: EntityMediaFormProps) {
  async function uploadHeroImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("citySlug", citySlug);
    formData.append("slug", slug);

    const res = await fetch("/api/upload/story-image", {
      method: "POST",
      body: formData,
    });

    const { url, error } = await res.json();
    if (error) return alert("Error uploading hero image.");

    setHeroImageUrl(url);
  }

  async function uploadHero360(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("citySlug", citySlug);
    formData.append("slug", slug);
    formData.append("filename", "hero-360");

    const res = await fetch("/api/upload/story-360", {
      method: "POST",
      body: formData,
    });

    const { url, error } = await res.json();
    if (error) return alert("Error uploading 360° image.");

    setHero360Url(url);
  }

  async function uploadMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const urls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("citySlug", citySlug);
      formData.append("slug", slug);

      const res = await fetch("/api/upload/story-media", {
        method: "POST",
        body: formData,
      });

      const { url, error } = await res.json();
      if (!error) urls.push(url);
    }

    setMediaUrls(urls);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Entity Media</h2>

      {/* Hero Image */}
      <div className="space-y-2">
        <label className="font-medium">Hero Image</label>
        <input
          type="file"
          accept="image/*"
          className="w-full border p-2 rounded"
          onChange={uploadHeroImage}
        />
        {heroImageUrl && (
          <img src={heroImageUrl} className="w-full rounded border" />
        )}
      </div>

      {/* Hero 360 */}
      <div className="space-y-2">
        <label className="font-medium">Hero 360° Image</label>
        <input
          type="file"
          accept="image/*"
          className="w-full border p-2 rounded"
          onChange={uploadHero360}
        />
        {hero360Url && (
          <img src={hero360Url} className="w-full rounded border" />
        )}
      </div>

      {/* Media Gallery */}
      <div className="space-y-2">
        <label className="font-medium">Gallery Media</label>
        <input
          type="file"
          accept="image/*,audio/*,video/*"
          multiple
          className="w-full border p-2 rounded"
          onChange={uploadMedia}
        />

        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaUrls.map((url, i) => (
              <div key={i} className="rounded border p-1">
                {url.match(/\.(mp4|mov|webm)$/i) ? (
                  <video src={url} controls className="w-full rounded" />
                ) : url.match(/\.(mp3|wav|ogg)$/i) ? (
                  <audio src={url} controls className="w-full" />
                ) : (
                  <img src={url} className="w-full rounded" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
