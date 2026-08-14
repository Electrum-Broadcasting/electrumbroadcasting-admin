"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

import StoryBasicsForm from "@/components/stories/StoryBasicsForm";
import StoryMetadataForm from "@/components/stories/StoryMetadataForm";
import Story360Form from "@/components/stories/Story360Form";
import StorySponsorForm from "@/components/stories/StorySponsorForm";
import StoryPublishForm from "@/components/stories/StoryPublishForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

import { replaceUnifiedRelationships } from "@/lib/joinTables";

export default function CreateStoryPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

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

      // Neighborhood dropdown
      const { data: neighborhoodList } = await supabase
        .from("civic_neighborhoods")
        .select("name")
        .eq("city_id", city.id)
        .order("name");

      setNeighborhoods(neighborhoodList || []);

      // Events
      const { data: eventList } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEvents(eventList || []);

      // Entities
      const { data: entityList } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEntities(entityList || []);

      // Artifacts
      const { data: artifactList } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setArtifacts(artifactList || []);

      // Stories
      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setStories(storyList || []);

      setLoading(false);
    }

    load();
  }, [citySlug]);

  async function handleCreate() {
    if (!cityId) return;

    const { data: newStory, error } = await supabase
      .from("civic_stories")
      .insert({
        city_id: cityId,

        // Basics
        title,
        slug,
        summary,
        body,
        category,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],

        // Metadata
        year,
        date_range: dateRange,
        neighborhood,

        // 360° Media
        hero_360_url: hero360Url,
        thumbnail_360_url: thumbnail360Url,
        neighborhood_360_url: neighborhood360Url,

        // Sponsorship
        sponsor_360_url: sponsor360Url,
        sponsor_flat_url: sponsorFlatUrl,
        sponsor_name: sponsorName,
        sponsor_link: sponsorLink,
        sponsor_alt_text: sponsorAltText,

        // Publish
        is_published: isPublished,
        is_frozen: isFrozen,
      })
      .select("*")
      .single();

    if (error || !newStory) {
      console.error(error);
      alert("Error creating story.");
      return;
    }

    // Unified relationships
    await replaceUnifiedRelationships(
      supabase,
      "story",
      newStory.id,
      selectedRelationships
    );

    router.push(`/${citySlug}/stories/${slug}/edit`);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Story</h1>

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
        setDateRange={setDateRange}
        neighborhood={neighborhood}
        setNeighborhood={setNeighborhood}
      />

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
        fromId={null}
        availableTargets={[
          { type: "event", label: "Events", items: events },
          { type: "entity", label: "Entities", items: entities },
          { type: "artifact", label: "Artifacts", items: artifacts },
          { type: "story", label: "Stories", items: stories },
        ]}
        initialRelationships={[]}
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
        onClick={handleCreate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Create Story
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
