"use client";

interface StoryHeroImageFormProps {
  heroImageUrl: string;
  setHeroImageUrl: (url: string) => void;
  citySlug: string;
  slug: string;
}

export default function StoryHeroImageForm({
  heroImageUrl,
  setHeroImageUrl,
  citySlug,
  slug,
}: StoryHeroImageFormProps) {
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

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Hero Image</h2>

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
            className="w-full h-auto rounded border"
          />
        )}
      </div>
    </section>
  );
}
