"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import StoryBasicsForm from "@/components/stories/StoryBasicsForm";
import StoryMetadataForm from "@/components/stories/StoryMetadataForm";
import Story360Form from "@/components/stories/Story360Form";
import StorySponsorForm from "@/components/stories/StorySponsorForm";
import StoryPublishForm from "@/components/stories/StoryPublishForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

import { replaceUnifiedRelationships, loadUnifiedRelationships } from "@/lib/joinTables";

export default function EditStoryPage({
  params,
}: {
  params: { citySlug: string; storySlug: string };
}) {
  const { citySlug, storySlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);

  // Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  // Metadata
  const [year, setYear] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);

  // 360° Media
  const [hero360Url, setHero360Url] = useState("");
  const [thumbnail360Url, setThumbnail360Url] = useState("");
  const [neighborhood360Url, setNeighborhood360Url] = useState("");

  // Sponsorship
  const [sponsor360Url, setSponsor360Url] = useState("");
  const [sponsorFlatUrl, setSponsorFlatUrl] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorLink, setSponsorLink] = useState("");
  const [sponsorAltText, setSponsorAltText] = useState("");

  // Publish
  const [isPublished, setIsPublished] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  // Relationships
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedRelationships, setSelectedRelationships] = useState<any[]>([]);

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
      const { data: story } = await supabase
        .from("civic_stories")
        .select("*")
        .eq("slug", storySlug)
        .eq("city_id", city.id)
        .single();

      if (!story) {
        setLoading(false);
        return;
      }

      setStoryId(story.id);

      // Populate fields
      setTitle(story.title);
      setSlug(story.slug);
      setSummary(story.summary || "");
      setBody(story.body || "");
      setCategory(story.category || "");
      setTags((story.tags || []).join(", "));
      setYear(story.year || null);
      setDateRange(story.date_range || "");
      setNeighborhood(story.neighborhood || "");

      setHero360Url(story.hero_360_url || "");
      setThumbnail360Url(story.thumbnail_360_url || "");
      setNeighborhood360Url(story.neighborhood_360_url || "");

      setSponsor360Url(story.sponsor_360_url || "");
      setSponsorFlatUrl(story.sponsor_flat_url || "");
      setSponsorName(story.sponsor_name || "");
      setSponsorLink(story.sponsor_link || "");
      setSponsorAltText(story.sponsor_alt_text || "");

      setIsPublished(story.is_published || false);
      setIsFrozen(story.is_frozen || false);

      // Neighborhood dropdown
      const { data: neighborhoodList } = await supabase
        .from("civic_neighborhoods")
        .select("name")
        .eq("city_id", city.id)
        .order("name");

      setNeighborhoods(neighborhoodList || []);

      // Load related civic objects
      const { data: eventList } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEvents(eventList || []);

      const { data: entityList } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEntities(entityList || []);

      const { data: artifactList } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setArtifacts(artifactList || []);

      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setStories(storyList || []);

      // Load unified relationships
      const unified = await loadUnifiedRelationships(supabase, "story", story.id);
      setSelectedRelationships(unified);

      setLoading(false);
    }

    load();
  }, [citySlug, storySlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!storyId) return <div className="p-6">Story not found</div>;

  async function handleSave() {
    const { error } = await supabase
      .from("civic_stories")
      .update({
        title,
        slug,
        summary,
        body,
        category,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        year,
        date_range: dateRange,
        neighborhood,

        hero_360_url: hero360Url,
        thumbnail_360_url: thumbnail360Url,
        neighborhood_360_url: neighborhood360Url,

        sponsor_360_url: sponsor360Url,
        sponsor_flat_url: sponsorFlatUrl,
        sponsor_name: sponsorName,
        sponsor_link: sponsorLink,
        sponsor_alt_text: sponsorAltText,

        is_published: isPublished,
        is_frozen: isFrozen,
      })
      .eq("id", storyId);

    if (error) {
      console.error(error);
      alert("Failed to save story");
      return;
    }

    await replaceUnifiedRelationships(
      supabase,
      "story",
      storyId,
      selectedRelationships
    );

    router.push(`/${citySlug}/stories/${slug}`);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this story? This cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("civic_stories")
      .delete()
      .eq("id", storyId);

    if (error) {
      console.error(error);
      alert("Error deleting story.");
      return;
    }

    router.push(`/${citySlug}/stories`);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Story</h1>

      <StoryBasicsForm
        title={title}
        setTitle={setTitle}
        slug={slug}
        setSlug={setSlug}
        summary={summary}
        setSummary={setSummary}
        body={body}
        setBody={setBody}
        category={category}
        setCategory={setCategory}
        tags={tags}
        setTags={setTags}
        categoryOptions={[
          "History",
          "Culture",
          "People",
          "Neighborhood",
          "Event",
        ]}
      />

      {/* Neighborhood Dropdown */}
      <select
        className="border p-2 w-full"
        value={neighborhood}
        onChange={(e) => setNeighborhood(e.target.value)}
      >
        <option value="">Select Neighborhood</option>
        {neighborhoods.map((n) => (
          <option key={n.name} value={n.name}>
            {n.name}
          </option>
        ))}
      </select>

      <StoryMetadataForm
        year={year}
        setYear={setYear}
        dateRange={dateRange}
        setDateRange={setDateRange} neighborhood={""} setNeighborhood={function (neighborhood: string): void {
          throw new Error("Function not implemented.");
        } }      />

      <Story360Form
        hero360Url={hero360Url}
        setHero360Url={setHero360Url}
        thumbnail360Url={thumbnail360Url}
        setThumbnail360Url={setThumbnail360Url}
        neighborhood360Url={neighborhood360Url}
        setNeighborhood360Url={setNeighborhood360Url}
        citySlug={citySlug}
        slug={slug}
      />

      <StorySponsorForm
        sponsor360Url={sponsor360Url}
        setSponsor360Url={setSponsor360Url}
        sponsorFlatUrl={sponsorFlatUrl}
        setSponsorFlatUrl={setSponsorFlatUrl}
        sponsorName={sponsorName}
        setSponsorName={setSponsorName}
        sponsorLink={sponsorLink}
        setSponsorLink={setSponsorLink}
        sponsorAltText={sponsorAltText}
        setSponsorAltText={setSponsorAltText}
      />

      <RelationshipSelector
        fromType="story"
        fromId={storyId}
        availableTargets={[
          { type: "event", label: "Events", items: events },
          { type: "entity", label: "Entities", items: entities },
          { type: "artifact", label: "Artifacts", items: artifacts },
          { type: "story", label: "Stories", items: stories },
        ]}
        initialRelationships={selectedRelationships}
        onChange={setSelectedRelationships}
      />

      <StoryPublishForm
        isPublished={isPublished}
        setIsPublished={setIsPublished}
      />

      {/* Frozen checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isFrozen}
          onChange={(e) => setIsFrozen(e.target.checked)}
        />
        Frozen
      </label>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Changes
      </button>

      <button
        onClick={handleDelete}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Delete Story
      </button>

      <button
        onClick={() => router.push(`/${citySlug}/stories`)}
        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  );
}
