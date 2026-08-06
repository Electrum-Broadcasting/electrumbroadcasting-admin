"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { replaceUnifiedRelationships, loadUnifiedRelationships } from "@/lib/joinTables";

export default function EditArtifactPage({
  params,
}: {
  params: { citySlug: string; artifactSlug: string };
}) {
  const { citySlug, artifactSlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

  // Publish
  const [isPublished, setIsPublished] = useState(false);

  // Relationships
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
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

      setYear(artifact.year || null);
      setTags((artifact.tags || []).join(", "));

      setIsPublished(artifact.is_published || false);

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
      const unified = await loadUnifiedRelationships(supabase, "artifact", artifact.id);
      setSelectedRelationships(unified);

      setLoading(false);
    }

    load();
  }, [citySlug, artifactSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!artifactId) return <div className="p-6">Artifact not found</div>;

  async function handleSave() {
    const { error } = await supabase
      .from("civic_artifacts")
      .update({
        title,
        slug,
        description,
        artifact_type: artifactType,

        hero_image_url: heroImageUrl,
        hero_360_url: hero360Url,
        media_urls: mediaUrls,

        year,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],

        is_published: isPublished,
      })
      .eq("id", artifactId);

    if (error) {
      console.error(error);
      alert("Failed to save artifact");
      return;
    }

    await replaceUnifiedRelationships(
      supabase,
      "artifact",
      artifactId,
      selectedRelationships
    );

    router.push(`/${citySlug}/artifacts/${slug}`);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this artifact? This cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("civic_artifacts")
      .delete()
      .eq("id", artifactId);

    if (error) {
      console.error(error);
      alert("Error deleting artifact.");
      return;
    }

    router.push(`/${citySlug}/artifacts`);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Artifact</h1>

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
          value={year || ""}
          onChange={(e) => setYear(Number(e.target.value))}
        />

        <input
          className="border p-2 w-full"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {/* Relationships */}
        <RelationshipSelector
          fromType="artifact"
          fromId={artifactId}
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "entity", label: "Entities", items: entities },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={selectedRelationships}
          onChange={setSelectedRelationships}
        />

        {/* Publish */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>

        {/* Actions */}
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
          Delete Artifact
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
