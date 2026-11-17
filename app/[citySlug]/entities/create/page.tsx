"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { entityRequest, EntityRequestError, readEntityMutation, saveEntityRelationships, type EntityRelationship } from "@/lib/entities/entityClient";

// NEW: Entity-specific uploaders
import EntityThumbnailUpload from "@/components/entities/EntityThumbnailUpload";
import EntityHeroImageUpload from "@/components/entities/EntityHeroImageUpload";
import EntityHero360Upload from "@/components/entities/EntityHero360Upload";
import EntityMediaUpload from "@/components/entities/EntityMediaUpload";

export default function CreateEntityPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const router = useRouter();

  const [supabase] = useState(createBrowserClient);

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  // Basics
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [entityType, setEntityType] = useState("");
  const [roles, setRoles] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");

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
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [eras, setEras] = useState<any[]>([]);

  // Unified relationships
  const [selectedRelationships, setSelectedRelationships] = useState<EntityRelationship[]>([]);

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

      const [eventList, artifactList, storyList, eraList] = await Promise.all([
        supabase.from("civic_events").select("id, name").eq("city_id", city.id).order("name"),
        supabase.from("civic_artifacts").select("id, title").eq("city_id", city.id).order("title"),
        supabase.from("civic_stories").select("id, title").eq("city_id", city.id).order("title"),
        supabase.from("civic_eras").select("id, name").eq("city_id", city.id).order("name"),
      ]);

      setEvents(eventList.data || []);
      setArtifacts(artifactList.data || []);
      setStories(storyList.data || []);
      setEras(eraList.data || []);

      setLoading(false);
    }

    load();
  }, [citySlug, supabase]);

  async function handleCreate() {
    if (!cityId || saving || unconfirmed) return;
    setSaving(true);
    setSaveError(null);
    let id = createdId;
    try {
      if (!id) {
        const body = await entityRequest("/api/admin/civic-entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            citySlug, name, ...(slug.trim() ? { slug } : {}), entity_type: entityType,
            roles, summary, description, thumbnail_url: thumbnailUrl,
            hero_image_url: heroImageUrl, hero_360_url: hero360Url, media_urls: mediaUrls,
            birth_year: birthYear, death_year: deathYear, year,
            tags: tags ? tags.split(",").map((t) => t.trim()) : [], era_id: eraId || null,
          }),
        });
        id = readEntityMutation(body).entityId;
        setCreatedId(id);
      }
      if (createdId || selectedRelationships.length) {
        await saveEntityRelationships(supabase, id, selectedRelationships);
      }
      router.push(`/${citySlug}/entities`);
    } catch (error) {
      console.error("Entity creation or relationship save failed:", error);
      if (id) {
        setSaveError(`Entity created (ID: ${id}), but relationships could not be saved. Retry relationships or return to the Entity list.`);
      } else {
        const uncertain = error instanceof EntityRequestError ? error.unconfirmed : true;
        setUnconfirmed(uncertain);
        setSaveError(error instanceof Error ? error.message : "Entity creation outcome is unconfirmed. Verify before retrying.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Entity</h1>

      <div className="space-y-8">

        <fieldset disabled={!!createdId || saving || unconfirmed} className="space-y-8">
        {/* Basics */}
        <label className="block text-sm font-medium">Name</label>
        <input className="border p-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="block text-sm font-medium">Slug</label>
        <input className="border p-2 w-full" value={slug} onChange={(e) => setSlug(e.target.value)} />

        <label className="block text-sm font-medium">Entity Type</label>
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

        <label className="block text-sm font-medium">Roles</label>
        <input className="border p-2 w-full" value={roles} onChange={(e) => setRoles(e.target.value)} />

        <label className="block text-sm font-medium">Summary</label>
        <textarea className="border p-2 w-full" value={summary} onChange={(e) => setSummary(e.target.value)} />

        <label className="block text-sm font-medium">Description</label>
        <textarea className="border p-2 w-full" value={description} onChange={(e) => setDescription(e.target.value)} />

        {/* Birth/Death */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Birth Year</label>
            <input type="number" className="border p-2 w-full" value={birthYear ?? ""} onChange={(e) => setBirthYear(e.target.value === "" ? null : Number(e.target.value))} />
          </div>

          <div>
            <label className="block text-sm font-medium">Death Year</label>
            <input type="number" className="border p-2 w-full" value={deathYear ?? ""} onChange={(e) => setDeathYear(e.target.value === "" ? null : Number(e.target.value))} />
          </div>
        </div>

        {/* Metadata */}
        <label className="block text-sm font-medium">Year (Timeline)</label>
        <input type="number" className="border p-2 w-full" value={year ?? ""} onChange={(e) => setYear(e.target.value === "" ? null : Number(e.target.value))} />

        <label className="block text-sm font-medium">Tags (comma separated)</label>
        <input className="border p-2 w-full" value={tags} onChange={(e) => setTags(e.target.value)} />

        <label className="block text-sm font-medium">Era</label>
        <select className="border p-2 w-full" value={eraId} onChange={(e) => setEraId(e.target.value)}>
          <option value="">Select Era</option>
          {eras.map((era) => (
            <option key={era.id} value={era.id}>{era.name}</option>
          ))}
        </select>

        {/* Media */}
        <EntityThumbnailUpload
          slug={slug}
          citySlug={citySlug}
          thumbnailUrl={thumbnailUrl}
          setThumbnailUrl={setThumbnailUrl}
        />

        <EntityHeroImageUpload
          slug={slug}
          citySlug={citySlug}
          heroImageUrl={heroImageUrl}
          setHeroImageUrl={setHeroImageUrl}
        />

        <EntityHero360Upload
          slug={slug}
          citySlug={citySlug}
          hero360Url={hero360Url}
          setHero360Url={setHero360Url}
        />

        <EntityMediaUpload
          slug={slug}
          citySlug={citySlug}
          mediaUrls={mediaUrls}
          setMediaUrls={setMediaUrls}
        />
        </fieldset>

        <p>Entities are created pending and unpublished.</p>
        {createdId && <p>Entity metadata has been saved. Only relationships will be retried.</p>}

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

        <button
          onClick={handleCreate}
          disabled={saving || unconfirmed || !cityId}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {saving ? "Saving…" : createdId ? "Retry Relationships" : "Create Entity"}
        </button>
        {saveError && <p role="alert">{saveError}</p>}

                <button
          onClick={() => router.push(`/${citySlug}/entities`)}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
