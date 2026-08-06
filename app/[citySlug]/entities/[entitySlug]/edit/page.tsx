"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { replaceUnifiedRelationships, loadUnifiedRelationships } from "@/lib/joinTables";
import StoryHeroImageForm from "@/components/stories/StoryHeroImageForm";
import ThumbnailUpload from "@/components/stories/ThumbnailUpload";

export default function EditEntityPage({
  params,
}: {
  params: { citySlug: string; entitySlug: string };
}) {
  const { citySlug, entitySlug } = params;
  const router = useRouter();

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);

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

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [eras, setEras] = useState<any[]>([]);

  // Unified relationships
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

      // Load entity
      const { data: entity } = await supabase
        .from("civic_entities")
        .select("*")
        .eq("slug", entitySlug)
        .eq("city_id", city.id)
        .single();

      if (!entity) {
        setLoading(false);
        return;
      }

      setEntityId(entity.id);

      // Populate fields
      setName(entity.name);
      setSlug(entity.slug);
      setEntityType(entity.entity_type || "");
      setRoles(entity.roles || "");
      setDescription(entity.description || "");
      setSummary(entity.summary || "");

      setThumbnailUrl(entity.thumbnail_url || "");
      setHeroImageUrl(entity.hero_image_url || "");
      setHero360Url(entity.hero_360_url || "");
      setMediaUrls(entity.media_urls || []);

      setBirthYear(entity.birth_year || null);
      setDeathYear(entity.death_year || null);
      setYear(entity.year || null);
      setTags((entity.tags || []).join(", "));
      setEraId(entity.era_id || "");

      // Load relationship targets
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

      // Load unified relationships
      const unified = await loadUnifiedRelationships(supabase, "entity", entity.id);
      setSelectedRelationships(unified);

      setLoading(false);
    }

    load();
  }, [citySlug, entitySlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!entityId) return <div className="p-6">Entity not found</div>;

  async function handleSave() {
    const { error } = await supabase
      .from("civic_entities")
      .update({
        name,
        slug,
        entity_type: entityType,
        roles,
        description,
        summary,

        thumbnail_url: thumbnailUrl,
        hero_image_url: heroImageUrl,
        hero_360_url: hero360Url,
        media_urls: mediaUrls,

        birth_year: birthYear,
        death_year: deathYear,
        year,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        era_id: eraId || null,

        is_published: true,
      })
      .eq("id", entityId);

    if (error) {
      console.error(error);
      alert("Failed to save entity");
      return;
    }

    await replaceUnifiedRelationships(
      supabase,
      "entity",
      entityId,
      selectedRelationships
    );

    router.push(`/${citySlug}/entities/${slug}`);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this entity? This cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("civic_entities")
      .delete()
      .eq("id", entityId);

    if (error) {
      console.error(error);
      alert("Error deleting entity.");
      return;
    }

    router.push(`/${citySlug}/entities`);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Entity</h1>

      <div className="space-y-8">

        {/* Basics */}
        <input className="border p-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border p-2 w-full" value={slug} onChange={(e) => setSlug(e.target.value)} />

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

        <input className="border p-2 w-full" value={roles} onChange={(e) => setRoles(e.target.value)} />

        <textarea className="border p-2 w-full" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <textarea className="border p-2 w-full" value={description} onChange={(e) => setDescription(e.target.value)} />

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
        <input className="border p-2 w-full" value={year ?? ""} onChange={(e) => setYear(Number(e.target.value))} />

        <input className="border p-2 w-full" value={tags} onChange={(e) => setTags(e.target.value)} />

        <select className="border p-2 w-full" value={eraId} onChange={(e) => setEraId(e.target.value)}>
          <option value="">Select Era</option>
          {eras.map((era) => (
            <option key={era.id} value={era.id}>{era.name}</option>
          ))}
        </select>

        {/* Media */}
        <ThumbnailUpload thumbnailUrl={thumbnailUrl} setThumbnailUrl={setThumbnailUrl} citySlug={citySlug} slug={slug} />

        <StoryHeroImageForm heroImageUrl={heroImageUrl} setHeroImageUrl={setHeroImageUrl} citySlug={citySlug} slug={slug} />

        <input className="border p-2 w-full" value={hero360Url} onChange={(e) => setHero360Url(e.target.value)} />

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

        {/* Relationships */}
        <RelationshipSelector
          fromType="entity"
          fromId={entityId}
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "artifact", label: "Artifacts", items: artifacts },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={selectedRelationships}
          onChange={setSelectedRelationships}
        />

        {/* Actions */}
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Changes
        </button>

        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Delete Entity
        </button>

        <button onClick={() => router.push(`/${citySlug}/entities`)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
          Cancel
        </button>
      </div>
    </div>
  );
}
