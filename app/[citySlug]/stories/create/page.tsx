"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateStoryPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const router = useRouter();

  const [cityId, setCityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const [year, setYear] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  // 360° fields
  const [hero360Url, setHero360Url] = useState("");
  const [thumbnail360Url, setThumbnail360Url] = useState("");
  const [neighborhood360Url, setNeighborhood360Url] = useState("");
  const [inline360Urls, setInline360Urls] = useState<string[]>([]);

  // Sponsorship
  const [sponsor360Url, setSponsor360Url] = useState("");
  const [sponsorFlatUrl, setSponsorFlatUrl] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorLink, setSponsorLink] = useState("");
  const [sponsorAltText, setSponsorAltText] = useState("");

  // Publication
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    async function loadCity() {
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (city) setCityId(city.id);
      setLoading(false);
    }

    loadCity();
  }, [citySlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cityId) return;

    const { error } = await supabase.from("civic_stories").insert({
      title,
      slug,
      summary,
      body,
      category,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      year,
      date_range: dateRange,
      neighborhood,
      city_id: cityId,

      hero_360_url: hero360Url,
      thumbnail_360_url: thumbnail360Url,
      neighborhood_360_url: neighborhood360Url,
      inline_360_urls: inline360Urls,

      sponsor_360_url: sponsor360Url,
      sponsor_flat_url: sponsorFlatUrl,
      sponsor_name: sponsorName,
      sponsor_link: sponsorLink,
      sponsor_alt_text: sponsorAltText,

      is_published: isPublished,
    });

    if (!error) {
      router.push(`/${citySlug}/stories`);
    } else {
      console.error(error);
      alert("Error creating story.");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Story</h1>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">

        {/* Story Basics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Story Basics</h2>

          <input
            type="text"
            placeholder="Title"
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="text"
            placeholder="Slug"
            className="w-full border p-2 rounded"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          <textarea
            placeholder="Summary"
            className="w-full border p-2 rounded"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />

          <textarea
            placeholder="Body"
            className="w-full border p-2 rounded h-40"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <input
            type="text"
            placeholder="Category"
            className="w-full border p-2 rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            type="text"
            placeholder="Tags (comma-separated)"
            className="w-full border p-2 rounded"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </section>

        {/* 360° Visuals */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">360° Visuals</h2>

          <input
            type="text"
            placeholder="Hero 360° URL"
            className="w-full border p-2 rounded"
            value={hero360Url}
            onChange={(e) => setHero360Url(e.target.value)}
          />

          <input
            type="text"
            placeholder="Thumbnail 360° URL"
            className="w-full border p-2 rounded"
            value={thumbnail360Url}
            onChange={(e) => setThumbnail360Url(e.target.value)}
          />

          <input
            type="text"
            placeholder="Neighborhood 360° URL"
            className="w-full border p-2 rounded"
            value={neighborhood360Url}
            onChange={(e) => setNeighborhood360Url(e.target.value)}
          />

          <textarea
            placeholder="Inline 360° URLs (comma-separated)"
            className="w-full border p-2 rounded"
            value={inline360Urls.join(", ")}
            onChange={(e) =>
              setInline360Urls(
                e.target.value.split(",").map((t) => t.trim())
              )
            }
          />
        </section>

        {/* Civic Metadata */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Civic Metadata</h2>

          <input
            type="number"
            placeholder="Year"
            className="w-full border p-2 rounded"
            value={year || ""}
            onChange={(e) => setYear(Number(e.target.value))}
          />

          <input
            type="text"
            placeholder="Date Range"
            className="w-full border p-2 rounded"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          />

          <input
            type="text"
            placeholder="Neighborhood"
            className="w-full border p-2 rounded"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
        </section>

        {/* Sponsorship */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Sponsorship</h2>

          <input
            type="text"
            placeholder="Sponsor 360° URL"
            className="w-full border p-2 rounded"
            value={sponsor360Url}
            onChange={(e) => setSponsor360Url(e.target.value)}
          />

          <input
            type="text"
            placeholder="Sponsor Flat Image URL"
            className="w-full border p-2 rounded"
            value={sponsorFlatUrl}
            onChange={(e) => setSponsorFlatUrl(e.target.value)}
          />

          <input
            type="text"
            placeholder="Sponsor Name"
            className="w-full border p-2 rounded"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Sponsor Link"
            className="w-full border p-2 rounded"
            value={sponsorLink}
            onChange={(e) => setSponsorLink(e.target.value)}
          />

          <input
            type="text"
            placeholder="Sponsor Alt Text"
            className="w-full border p-2 rounded"
            value={sponsorAltText}
            onChange={(e) => setSponsorAltText(e.target.value)}
          />
        </section>

        {/* Publication */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Publication</h2>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span>Publish this story</span>
          </label>
        </section>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Story
        </button>
      </form>
    </div>
  );
}