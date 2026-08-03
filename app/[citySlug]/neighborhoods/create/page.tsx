"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function CreateNeighborhoodPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      setCityId(city.id);
      setLoading(false);
    }

    load();
  }, [citySlug]);

  async function handleCreate() {
    if (!cityId) return;

    const { data: newNeighborhood, error } = await supabase
      .from("civic_neighborhoods")
      .insert({
        city_id: cityId,
        name,
        slug,
        description,
        thumbnail_url: thumbnailUrl,
        is_published: isPublished,
      })
      .select("*")
      .single();

    if (error || !newNeighborhood) {
      console.error(error);
      alert("Error creating neighborhood.");
      return;
    }

    router.push(`/${citySlug}/neighborhoods`);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Neighborhood</h1>

      <div className="space-y-8">
        <input
          className="border p-2 w-full"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Thumbnail URL"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>

        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Neighborhood
        </button>
      </div>
    </div>
  );
}
