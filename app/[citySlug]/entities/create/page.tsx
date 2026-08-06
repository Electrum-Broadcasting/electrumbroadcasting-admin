"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { replaceUnifiedRelationships } from "@/lib/joinTables";
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
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  // Basics
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [entityType, setEntityType] = useState("");
  const [roles, setRoles] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");

  // Media
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [hero360Url, setHero360Url] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  // Metadata
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [deathYear, setDeathYear] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [tags, setTags] = useState("");
  const [eraId, setEraId] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [eras, setEras] = useState<any[]>([]);

  // Unified relationships
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
        .order("name");

      setEvents(eventList || []);

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

      const { data: eraList } = await supabase
        .from("civic_eras")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEras(eraList || []);

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

        // Basics
        name,
        slug,
        entity_type: entityType,
        roles,
        description,
        summary,

        // Media
        thumbnail_url: thumbnailUrl,
        hero_image_url: heroImageUrl,
        hero_360_url: hero360Url,
        media_urls: mediaUrls,

        // Metadata
        birth_year: birthYear,
        death_year: deathYear,
        year,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        era_id: eraId || null,

        // Publish
        is_published: false,
      })
      .select("*")
      .single();

    if (error || !newEntity) {
      console.error(error);
      alert("Error creating entity.");
      return;
    }

    await replaceUnifiedRelationships(
      supabase,
      "entity",
      newEntity.id,
      selectedRelationships
    );

    router.push(`/${citySlug}/entities/${slug}/edit`);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Entity</h1>

      <div className="space-y-8">

        {/* Basics */}
        <input className="border p-2 w-full" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />

        <select className="border p-2 w-full" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">Select Entity Type</option>
          <option value="person">Person</option>
          <option value="organization">Organization</option>
          <option value="landmark">Landmark</option>
          <option value="business">Business</option>
          <option value="institution">Institution</option>
          <option value="cultural">Cultural</option>
          <option value="historical">Historical</option>
        </select>

        <input className="border p-2 w-full" placeholder="Roles" value={roles} onChange={(e) => setRoles(e.target.value)} />

        <textarea className="border p-2 w-full" placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <textarea className="border p-2 w-full" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        {/* Birth/Death */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Birth Year</label>
            <input type="number" value={birthYear ?? ""} onChange={(e) => setBirthYear(Number(e.target.value))} className="border p-2 w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium">Death Year</label>
            <input type="number" value={deathYear ?? ""} onChange={(e) => setDeathYear(Number(e.target.value))} className="border p-2 w-full" />
          </div>
        </div>

        {/* Metadata */}
        <input className="border p-2 w-full" placeholder="Year" value={year ?? ""} onChange={(e) => setYear(Number(e.target.value))} />

        <input className="border p-2 w-full" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />

        <select className="border p-2 w-full" value={eraId} onChange={(e) => setEraId(e.target.value)}>
          <option value="">Select Era</option>
          {eras.map((era) => (
            <option key={era.id} value={era.id}>{era.name}</option>
          ))}
        </select>

        {/* Media */}
        <ThumbnailUpload thumbnailUrl={thumbnailUrl} setThumbnailUrl={setThumbnailUrl} citySlug={citySlug} slug={slug} />

        <StoryHeroImageForm heroImageUrl={heroImageUrl} setHeroImageUrl={setHeroImageUrl} citySlug={citySlug} slug={slug} />

        {/* Hero 360 */}
        <input className="border p-2 w-full" placeholder="Hero 360° URL" value={hero360Url} onChange={(e) => setHero360Url(e.target.value)} />

        {/* Media URLs */}
        <div className="space-y-2">
          <label className="font-semibold">Additional Media URLs</label>

          {mediaUrls.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <input className="border p-2 w-full" value={url} onChange={(e) => {
                const updated = [...mediaUrls];
                updated[idx] = e.target.value;
                setMediaUrls(updated);
              }} />
              <button className="bg-red-600 text-white px-3 rounded" onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}>X</button>
            </div>
          ))}

          <button className="bg-gray-300 px-3 py-1 rounded" onClick={() => setMediaUrls([...mediaUrls, ""])}>Add Media URL</button>
        </div>

        {/* Publish */}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Published
        </label>

        {/* Relationships */}
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

        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create Entity
        </button>
      </div>
    </div>
  );
}
