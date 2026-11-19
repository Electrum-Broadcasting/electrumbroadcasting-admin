"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { saveCivicRelationships, type CivicRelationship } from "@/lib/admin/civicObjectClient";
import { useCivicEdit } from "@/hooks/useCivicObjectMutation";
import CivicLifecycleControls from "@/components/admin/CivicLifecycleControls";

export default function EditArtifactPage({
  params,
}: {
  params: { citySlug: string; artifactSlug: string };
}) {
  const { citySlug, artifactSlug } = params;
  const router = useRouter();

  const [supabase] = useState(createBrowserClient);

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);

  // Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [artifactType, setArtifactType] = useState("");

  // Media
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [hero360Url, setHero360Url] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  // Metadata
  const [year, setYear] = useState<number | null>(null);
  const [tags, setTags] = useState("");

  const [relationshipsLoaded, setRelationshipsLoaded] = useState(false);
  const [relationshipsError, setRelationshipsError] = useState<string | null>(null);

  // Relationships
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedRelationships, setSelectedRelationships] = useState<CivicRelationship[]>([]);
  const mutation = useCivicEdit("artifact", artifactId, citySlug, "artifacts");

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

      // Load artifact
      const { data: artifact } = await supabase
        .from("civic_artifacts")
        .select("*")
        .eq("slug", artifactSlug)
        .eq("city_id", city.id)
        .single();

      if (!artifact) {
        setLoading(false);
        return;
      }

      setArtifactId(artifact.id);

      // Populate fields
      setTitle(artifact.title);
      setSlug(artifact.slug);
      setDescription(artifact.description || "");
      setArtifactType(artifact.artifact_type || "");

      setHeroImageUrl(artifact.hero_image_url || "");
      setHero360Url(artifact.hero_360_url || "");
      setMediaUrls(artifact.media_urls || []);

      setYear(artifact.year ?? null);
      setTags((artifact.tags || []).join(", "));

      // Load relationship targets
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

      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setStories(storyList || []);

      // Load unified relationships
      const { data: unified, error: relationshipError } = await supabase
        .from("civic_relationships").select("*").eq("from_type", "artifact").eq("from_id", artifact.id);
      if (relationshipError) {
        console.error("Failed to load Artifact relationships:", relationshipError);
        setRelationshipsError("Unable to load relationships. Relationship changes are disabled.");
      } else {
        setSelectedRelationships(unified || []);
        setRelationshipsLoaded(true);
      }

      setLoading(false);
    }

    load();
  }, [citySlug, artifactSlug, supabase]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!artifactId) return <div className="p-6">Artifact not found</div>;

  async function handleSave() {
    await mutation.save({
      title, slug, description, artifact_type: artifactType, hero_image_url: heroImageUrl,
      hero_360_url: hero360Url, media_urls: mediaUrls, year,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    }, `/${citySlug}/artifacts/${encodeURIComponent(slug)}`);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Artifact</h1>
      <a className="text-blue-600 underline" href={`/${citySlug}/panoramas/artifact/${artifactId}`}>Manage panoramas</a>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {relationshipsError && <p role="alert">{relationshipsError}</p>}
      {mutation.message && <p role="status">{mutation.message}</p>}
      <p>Metadata and relationships are saved separately.</p>
      <CivicLifecycleControls {...mutation} />

      <div className="space-y-8">

        {/* Basics */}
        <input
          className="border p-2 w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          value={artifactType}
          onChange={(e) => setArtifactType(e.target.value)}
        />

        {/* Media */}
        <input
          className="border p-2 w-full"
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          value={hero360Url}
          onChange={(e) => setHero360Url(e.target.value)}
        />

        {/* Media URLs array */}
        <div className="space-y-2">
          <label className="font-semibold">Additional Media URLs</label>

          {mediaUrls.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                className="border p-2 w-full"
                value={url}
                onChange={(e) => {
                  const updated = [...mediaUrls];
                  updated[idx] = e.target.value;
                  setMediaUrls(updated);
                }}
              />
              <button
                className="bg-red-600 text-white px-3 rounded"
                onClick={() => {
                  setMediaUrls(mediaUrls.filter((_, i) => i !== idx));
                }}
              >
                X
              </button>
            </div>
          ))}

          <button
            className="bg-gray-300 px-3 py-1 rounded"
            onClick={() => setMediaUrls([...mediaUrls, ""])}
          >
            Add Media URL
          </button>
        </div>

        {/* Metadata */}
        <input
          className="border p-2 w-full"
          type="number"
          value={year ?? ""}
          onChange={(e) => setYear(e.target.value === "" ? null : Number(e.target.value))}
        />

        <input
          className="border p-2 w-full"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {/* Relationships */}
        {relationshipsLoaded && <fieldset disabled={mutation.busy || mutation.unconfirmed || !mutation.actions?.canEdit}><RelationshipSelector
          fromType="artifact"
          fromId={artifactId}
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "entity", label: "Entities", items: entities },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={selectedRelationships}
          onChange={setSelectedRelationships}
        /></fieldset>}

        {/* Actions */}
        {mutation.actions?.canEdit && <button
          onClick={handleSave}
          disabled={mutation.busy || mutation.unconfirmed}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Metadata
        </button>}

        {mutation.actions?.canEdit && relationshipsLoaded && <button
          onClick={() => mutation.saveLinks(() => saveCivicRelationships(supabase, "artifact", artifactId, selectedRelationships))}
          disabled={mutation.busy || mutation.unconfirmed}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >Save Relationships</button>}

        <button
          onClick={() => router.push(`/${citySlug}/artifacts`)}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
