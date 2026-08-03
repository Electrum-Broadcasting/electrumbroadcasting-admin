"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";
import { replaceUnifiedRelationships } from "@/lib/joinTables";

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

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [entityType, setEntityType] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);

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

        <input
          className="border p-2 w-full"
          placeholder="Entity Type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
