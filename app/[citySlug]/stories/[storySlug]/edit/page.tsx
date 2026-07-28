"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditStoryPage({
  params,
}: {
  params: { citySlug: string; storySlug: string };
}) {
  const { citySlug, storySlug } = params;
  const router = useRouter();

  const [cityId, setCityId] = useState<string | null>(null);
  const [story, setStory] = useState<any>(null);
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
    async function load() {
      // Load city
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

      // Load story
      const { data: storyData } = await supabase
        .from("civic_stories")
        .select("*")
        .eq("slug", storySlug)
        .eq("city_id", city.id)
        .single();

      if (!storyData) {
        setLoading(false);
        return;
      }

      setStory(storyData);

      // Populate form fields
      setTitle(storyData.title || "");
      setSlug(storyData.slug || "");
      setSummary(storyData.summary || "");
      setBody(storyData.body || "");
      setCategory(storyData.category || "");
      setTags((storyData.tags || []).join(", "));

      setYear(storyData.year || null);
      setDateRange(storyData.date_range || "");
      setNeighborhood(storyData.neighborhood || "");

      setHero360Url(storyData.hero_360_url || "");
      setThumbnail360Url(storyData.thumbnail_360_url || "");
      setNeighborhood360Url(storyData.neighborhood_360_url || "");
      setInline360Urls(storyData.inline_360_urls || []);

      setSponsor360Url(storyData.sponsor_360_url || "");
      setSponsorFlatUrl(storyData.sponsor_flat_url || "");
      setSponsorName(storyData.sponsor_name || "");
      setSponsorLink(storyData.sponsor_link || "");
      setSponsorAltText(storyData.sponsor_alt_text || "");

      setIsPublished(storyData.is_published || false);

      setLoading(false);
    }

    load();
  }, [citySlug, storySlug]);

  async function handleSave() {
    if (!cityId || !story) return;

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    const { error } = await supabase
      .from("civic_stories")
      .update({
        title,
        slug,
        summary,
        body,
        category,
        tags: tagsArray,
        year,
        date_range: dateRange,
        neighborhood,
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
      })
      .eq("id", story.id);

    if (error) {
      console.error("Error updating story:", error);
      alert("Failed to save story");
      return;
    }

    router.push(`/${citySlug}/stories/${slug}`);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!story) {
    return <div>Story not found</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Story</h1>

      <div className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full border p-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block font-semibold">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border p-2"
            rows={10}
          />
        </div>

        <div>
          <label className="block font-semibold">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Year</label>
          <input
            type="number"
            value={year || ""}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Date Range</label>
          <input
            type="text"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Neighborhood</label>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <hr className="my-6" />

        <h2 className="text-xl font-bold">360° Images</h2>

        <div>
          <label className="block font-semibold">Hero 360° URL</label>
          <input
            type="text"
            value={hero360Url}
            onChange={(e) => setHero360Url(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Thumbnail 360° URL</label>
          <input
            type="text"
            value={thumbnail360Url}
            onChange={(e) => setThumbnail360Url(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Neighborhood 360° URL</label>
          <input
            type="text"
            value={neighborhood360Url}
            onChange={(e) => setNeighborhood360Url(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <hr className="my-6" />

        <h2 className="text-xl font-bold">Sponsor</h2>

        <div>
          <label className="block font-semibold">Sponsor 360° URL</label>
          <input
            type="text"
            value={sponsor360Url}
            onChange={(e) => setSponsor360Url(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Sponsor Flat URL</label>
          <input
            type="text"
            value={sponsorFlatUrl}
            onChange={(e) => setSponsorFlatUrl(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Sponsor Name</label>
          <input
            type="text"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Sponsor Link</label>
          <input
            type="text"
            value={sponsorLink}
            onChange={(e) => setSponsorLink(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Sponsor Alt Text</label>
          <input
            type="text"
            value={sponsorAltText}
            onChange={(e) => setSponsorAltText(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <hr className="my-6" />

        <div>
          <label className="flex items-center font-semibold">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mr-2"
            />
            Published
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Save
          </button>
          <Link href={`/${citySlug}/stories/${slug}`}>
            <button className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500">
              Cancel
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}