"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { entityRequest, EntityRequestError, readEntityActions, readEntityMutation, saveEntityRelationships, type EntityActions, type EntityRelationship } from "@/lib/entities/entityClient";

import EntityThumbnailUpload from "@/components/entities/EntityThumbnailUpload";
import EntityHeroImageUpload from "@/components/entities/EntityHeroImageUpload";
import EntityHero360Upload from "@/components/entities/EntityHero360Upload";
import EntityMediaUpload from "@/components/entities/EntityMediaUpload";

export default function EditEntityPage({
  params,
}: {
  params: { citySlug: string; entitySlug: string };
}) {
  const { citySlug, entitySlug } = params;
  const router = useRouter();

  const [supabase] = useState(createBrowserClient);

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);

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
  const [actions, setActions] = useState<EntityActions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [relationshipsLoaded, setRelationshipsLoaded] = useState(false);

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [eras, setEras] = useState<any[]>([]);

  // Unified relationships
  const [selectedRelationships, setSelectedRelationships] = useState<EntityRelationship[]>([]);

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
      setSummary(entity.summary || "");
      setDescription(entity.description || "");

      setThumbnailUrl(entity.thumbnail_url || "");
      setHeroImageUrl(entity.hero_image_url || "");
      setHero360Url(entity.hero_360_url || "");
      setMediaUrls(entity.media_urls || []);

      setBirthYear(entity.birth_year);
      setDeathYear(entity.death_year);
      setYear(entity.year);
      setTags((entity.tags || []).join(", "));
      setEraId(entity.era_id || "");
      try {
        setActions(readEntityActions(await entityRequest(`/api/admin/civic-entities/${entity.id}`)));
      } catch (error) {
        console.error("Failed to load Entity permissions:", error);
        setError(error instanceof Error ? error.message : "Unable to load Entity permissions.");
      }

      // Load relationship targets
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

      // Load unified relationships
      const { data: rels, error: relationshipsError } = await supabase
        .from("civic_relationships")
        .select("*")
        .eq("from_type", "entity")
        .eq("from_id", entity.id);

      if (relationshipsError) {
        console.error("Failed to load Entity relationships:", relationshipsError);
        setError("Unable to load relationships. Relationship changes are disabled.");
      } else {
        setSelectedRelationships(rels || []);
        setRelationshipsLoaded(true);
      }

      setLoading(false);
    }

    load();
  }, [citySlug, entitySlug, supabase]);

  async function handleSave() {
    if (!cityId || !entityId || busy || unconfirmed) return;
    setBusy(true);
    setError(null);
    try {
      const body = await entityRequest(`/api/admin/civic-entities/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, entity_type: entityType, roles, summary, description,
          thumbnail_url: thumbnailUrl, hero_image_url: heroImageUrl,
          hero_360_url: hero360Url, media_urls: mediaUrls, birth_year: birthYear,
          death_year: deathYear, year, tags: tags ? tags.split(",").map((t) => t.trim()) : [],
          era_id: eraId || null,
        }),
      });
      readEntityMutation(body);
      router.push(`/${citySlug}/entities/${slug}`);
    } catch (error) {
      console.error("Entity metadata save failed:", error);
      setUnconfirmed(error instanceof EntityRequestError && error.unconfirmed);
      setError(error instanceof Error ? error.message : "Unable to save Entity metadata.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRelationships() {
    if (!entityId || busy || !relationshipsLoaded) return;
    setBusy(true);
    setError(null);
    try {
      await saveEntityRelationships(supabase, entityId, selectedRelationships);
      alert("Relationships saved.");
    } catch (error) {
      console.error("Entity relationship save failed:", error);
      setError("Relationships could not be saved and may have changed. Retry or reload to verify.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLifecycle(operation: "approve" | "hide" | "restore") {
    if (!entityId || busy || unconfirmed) return;
    const prompts = {
      approve: "Approve and publish this Entity?",
      hide: "Hide this Entity?",
      restore: "Restore this Entity to pending and unpublished?",
    };
    if (!confirm(prompts[operation])) return;
    setBusy(true);
    setError(null);
    let confirmed = false;
    try {
      const body = await entityRequest(`/api/admin/civic-entities/${entityId}/${operation}`, { method: "POST" });
      readEntityMutation(body);
      confirmed = true;
      setActions(readEntityActions(await entityRequest(`/api/admin/civic-entities/${entityId}`)));
    } catch (error) {
      console.error("Entity lifecycle operation failed:", error);
      setActions(null);
      if (confirmed) {
        setError("Lifecycle action succeeded, but the latest permissions could not be loaded. Reload to continue.");
      } else {
        setUnconfirmed(error instanceof EntityRequestError && error.unconfirmed);
        setError(error instanceof Error ? error.message : "Unable to update Entity lifecycle.");
        if (!(error instanceof EntityRequestError && error.unconfirmed)) {
          try {
            setActions(readEntityActions(await entityRequest(`/api/admin/civic-entities/${entityId}`)));
          } catch (refreshError) {
            console.error("Failed to refresh Entity permissions:", refreshError);
            setError("The lifecycle action failed and permissions could not be refreshed. Reload to continue.");
          }
        }
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!entityId) return <div className="p-6">Entity not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Entity</h1>
      {entityId && <a className="text-blue-600 underline" href={`/${citySlug}/panoramas/entity/${entityId}`}>Manage panoramas</a>}
      {error && <p role="alert">{error}</p>}
      {actions && <p>Status: {actions.status} · Published: {actions.isPublished ? "Yes" : "No"}</p>}
      <p>Metadata and relationships are saved separately.</p>

      <div className="space-y-8">

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
            <input type="number" className="border p-2 w-full" value={birthYear ?? ""} onChange={(e) => setBirthYear(Number(e.target.value))} />
          </div>

          <div>
            <label className="block text-sm font-medium">Death Year</label>
            <input type="number" className="border p-2 w-full" value={deathYear ?? ""} onChange={(e) => setDeathYear(Number(e.target.value))} />
          </div>
        </div>

        {/* Metadata */}
        <label className="block text-sm font-medium">Year (Timeline)</label>
        <input className="border p-2 w-full" value={year ?? ""} onChange={(e) => setYear(Number(e.target.value))} />

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

        {/* Relationships */}
        {relationshipsLoaded && <RelationshipSelector
          fromType="entity"
          fromId={entityId}
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "artifact", label: "Artifacts", items: artifacts },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={selectedRelationships}
          onChange={setSelectedRelationships}
        />}

        {actions?.canEdit && <button
          onClick={handleSave}
          disabled={busy || unconfirmed}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Metadata
        </button>}
        {actions?.canEdit && relationshipsLoaded && <button
          onClick={handleRelationships}
          disabled={busy || unconfirmed}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Relationships
        </button>}
        {actions?.canApprove && <button disabled={busy || unconfirmed} onClick={() => handleLifecycle("approve")}>Approve</button>}
        {actions?.canHide && <button disabled={busy || unconfirmed} onClick={() => handleLifecycle("hide")}>Hide</button>}
        {actions?.canRestore && <button disabled={busy || unconfirmed} onClick={() => handleLifecycle("restore")}>Restore to Pending</button>}

        <button
          onClick={() => router.push(`/${citySlug}/entities/${slug}`)}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
