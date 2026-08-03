"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { replaceUnifiedRelationships } from "@/lib/joinTables";

interface CreateArtifactPageProps {
  params: {
    citySlug: string;
  };
}

export default function CreateArtifactPage({ params }: CreateArtifactPageProps) {
  const { citySlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [artifactType, setArtifactType] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Unified relationships (selected)
  const [selectedRelationships, setSelectedRelationships] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      //
      // 1. Load city
      //
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

      //
      // 2. Load relationship targets
      //
      const { data: eventList } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      setEvents(eventList || []);

      const { data: entityList } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      setEntities(entityList || []);

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

    //
    // 1. Insert artifact
    //
    const { data: newArtifact, error } = await supabase
      .from("civic_artifacts")
      .insert({
        city_id: cityId,
        title,
        slug,
        description,
        artifact_type: artifactType,
        thumbnail_url: thumbnailUrl,
        is_published: isPublished,
      })
      .select("*")
      .single();

    if (error || !newArtifact) {
      console.error(error);
      alert("Error creating artifact.");
      return;
    }

    //
    // 2. Unified relationships (WRITE)
    //
    await replaceUnifiedRelationships(
      supabase,
      "artifact",
      newArtifact.id,
      selectedRelationships
    );

    //
    // 3. Redirect
    //
    router.push(`/${citySlug}/artifacts`);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Artifact</h1>

      <div className="space-y-8">
        {/* Basic fields */}
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

        <input
          className="border p-2 w-full"
          placeholder="Thumbnail URL"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
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
          fromType="artifact"
          fromId={null} // no ID yet
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "entity", label: "Entities", items: entities },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={[]}
          onChange={setSelectedRelationships}
        />

        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Artifact
        </button>
      </div>
    </div>
  );
}
