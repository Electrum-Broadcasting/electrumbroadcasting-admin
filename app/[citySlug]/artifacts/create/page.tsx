"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { saveCivicRelationships, type CivicRelationship } from "@/lib/admin/civicObjectClient";
import { useCivicCreate } from "@/hooks/useCivicObjectMutation";

interface CreateArtifactPageProps {
  params: {
    citySlug: string;
  };
}

export default function CreateArtifactPage({ params }: CreateArtifactPageProps) {
  const { citySlug } = params;
  const router = useRouter();

  const [supabase] = useState(createBrowserClient);
  const mutation = useCivicCreate("artifact", citySlug, "artifacts");

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

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

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Unified relationships
  const [selectedRelationships, setSelectedRelationships] = useState<CivicRelationship[]>([]);

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

      setLoading(false);
    }

    load();
  }, [citySlug, supabase]);

  async function handleCreate() {
    if (!cityId) return;

    await mutation.create({
      title, ...(slug.trim() ? { slug } : {}), description, artifact_type: artifactType,
      hero_image_url: heroImageUrl, hero_360_url: hero360Url, media_urls: mediaUrls,
      year, tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    }, async (id) => {
      if (mutation.createdId || selectedRelationships.length) {
        await saveCivicRelationships(supabase, "artifact", id, selectedRelationships);
      }
    }, slug.trim() ? `/${citySlug}/artifacts/${encodeURIComponent(slug)}/edit` : undefined);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Artifact</h1>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      <p>Artifacts are created pending and unpublished.</p>
      {mutation.createdId && <p>Metadata was saved. Only relationships will be retried.</p>}

      <div className="space-y-8">
        <fieldset disabled={!!mutation.createdId || mutation.busy || mutation.unconfirmed} className="space-y-8">

        {/* Basics */}
        <input
          className="border p-2 w-full"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Artifact Type"
          value={artifactType}
          onChange={(e) => setArtifactType(e.target.value)}
        />

        {/* Media */}
        <input
          className="border p-2 w-full"
          placeholder="Hero Image URL"
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Hero 360° URL"
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
          placeholder="Year"
          type="number"
          value={year ?? ""}
          onChange={(e) => setYear(e.target.value === "" ? null : Number(e.target.value))}
        />

        <input
          className="border p-2 w-full"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        </fieldset>
        {/* Relationships */}
        <fieldset disabled={mutation.busy || mutation.unconfirmed}><RelationshipSelector
          fromType="artifact"
          fromId={null}
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "entity", label: "Entities", items: entities },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={[]}
          onChange={setSelectedRelationships}
        /></fieldset>

        {/* Actions */}
        <button
          onClick={handleCreate}
          disabled={mutation.busy || mutation.unconfirmed || !cityId}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {mutation.busy ? "Saving…" : mutation.createdId ? "Retry Relationships" : "Create Artifact"}
        </button>

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
