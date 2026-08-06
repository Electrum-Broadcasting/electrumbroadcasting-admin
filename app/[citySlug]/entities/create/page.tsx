"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { replaceUnifiedRelationships } from "@/lib/joinTables";
import Story360Form from "@/components/stories/Story360Form";
import StoryHeroImageForm from "@/components/stories/StoryHeroImageForm";
import ThumbnailUpload from "@/components/stories/ThumbnailUpload";

interface CreateEntityPageProps {
  params: {
    citySlug: string;
  };
}

export default function CreateEntityPage({ params }: CreateEntityPageProps) {
  const { citySlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient(
    
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [entityType, setEntityType] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [hero360Url, setHero360Url] = useState("");
  const [neighborhood360Url, setNeighborhood360Url] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [deathYear, setDeathYear] = useState<number | null>(null);

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Unified relationships (selected)
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

      const { data: eventList } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      setEvents(eventList || []);

      const { data: artifactList } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title", { ascending: true });

      setArtifacts(artifactList || []);

      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title", { ascending: true });

      setStories(storyList || []);

      setLoading(false);
    }

    load();
  }, [citySlug]);

  async function handleCreate() {
    if (!cityId) return;

    const { data: newEntity, error } = await supabase
      .from("civic_entities")
      .insert({
        city_id: cityId,
        name,
        slug,
        entity_type: entityType,
        description,
        thumbnail_url: thumbnailUrl,
        is_published: isPublished,
      })
      .select("*")
      .single();

    if (error || !newEntity) {
      console.error(error);
      alert("Error creating entity.");
      return;
    }

    // Unified relationships (WRITE)
    await replaceUnifiedRelationships(
      supabase,
      "entity",
      newEntity.id,
      selectedRelationships
    );

    router.push(`/${citySlug}/entities`);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Entity</h1>

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

        <select
          className="border p-2 w-full"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="">Select Entity Type</option>
          <option value="person">Person</option>
          <option value="organization">Organization</option>
          <option value="landmark">Landmark</option>
          <option value="business">Business</option>
          <option value="institution">Institution</option>
          <option value="cultural">Cultural</option>
          <option value="historical">Historical</option>
        </select>

        

        {/* Summary */}
        <textarea
  className="border p-2 w-full"
  placeholder="Summary"
  value={summary}
  onChange={(e) => setSummary(e.target.value)}
/>

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium">Birth Year</label>
    <input
      type="number"
      value={birthYear ?? ""}
      onChange={(e) => setBirthYear(Number(e.target.value))}
      className="input"
    />
  </div>

  <div>
    <label className="block text-sm font-medium">Death Year</label>
    <input
      type="number"
      value={deathYear ?? ""}
      onChange={(e) => setDeathYear(Number(e.target.value))}
      className="input"
    />
  </div>
</div>


<ThumbnailUpload
  thumbnailUrl={thumbnailUrl}
  setThumbnailUrl={setThumbnailUrl}
  citySlug={citySlug}
  slug={slug}
/>

{/* Hero Image */}
        <StoryHeroImageForm
          heroImageUrl={heroImageUrl}
          setHeroImageUrl={setHeroImageUrl}
          citySlug={citySlug}
          slug={slug}
        />

        {/* 360° Media */}
                <Story360Form
                  hero360Url={hero360Url}
                  setHero360Url={setHero360Url}
                  thumbnail360Url={thumbnailUrl}
                  setThumbnail360Url={setThumbnailUrl}
                  neighborhood360Url={neighborhood360Url}
                  setNeighborhood360Url={setNeighborhood360Url}
                  inline360Urls={mediaUrls}
                  setInline360Urls={setMediaUrls}
                  citySlug={citySlug}
                  slug={slug}
                />



        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>

        <RelationshipSelector
          fromType="entity"
          fromId={null}
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "artifact", label: "Artifacts", items: artifacts },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={[]}
          onChange={setSelectedRelationships}
        />

        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Entity
        </button>
      </div>
    </div>
  );
}
