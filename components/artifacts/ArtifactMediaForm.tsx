"use client";

interface ArtifactMediaFormProps {
  heroImageUrl: string;
  setHeroImageUrl: (url: string) => void;
  mediaUrls: string[];
  setMediaUrls: (urls: string[]) => void;
  citySlug: string;
  slug: string;
}

export default function ArtifactMediaForm({
  heroImageUrl,
  setHeroImageUrl,
  mediaUrls,
  setMediaUrls,
  citySlug,
  slug,
}: ArtifactMediaFormProps) {
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
    if (error) {
      console.error(error);
      alert("Error uploading hero image.");
      return;
    }

    setHeroImageUrl(url);
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
      <h2 className="text-xl font-semibold">Artifact Media</h2>

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
          <img
            src={heroImageUrl}
            alt="Hero preview"
            className="w-full rounded border"
          />
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
