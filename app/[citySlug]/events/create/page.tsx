"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

import EventBasicsForm from "@/components/events/EventBasicsForm";
import EventDatesForm from "@/components/events/EventDatesForm";
import EventErasForm from "@/components/events/EventErasForm";
import EventMetadataForm from "@/components/events/EventMetadataForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

import { replaceUnifiedRelationships } from "@/lib/joinTables";

export default function CreateEventPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [tags, setTags] = useState("");
  const [thumbnail360Url, setThumbnail360Url] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Eras
  const [eras, setEras] = useState<any[]>([]);
  const [selectedEraIds, setSelectedEraIds] = useState<string[]>([]);

  // Relationships
  const [entities, setEntities] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
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

      const { data: eraList } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("city_id", city.id)
        .order("start_year", { ascending: true });

      setEras(eraList || []);

      const { data: entityList } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      setEntities(entityList || []);

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

    const { data: newEvent, error } = await supabase
      .from("civic_events")
      .insert({
        city_id: cityId,
        name,
        slug,
        event_type: eventType,
        description,
        start_date: startDate || null,
        end_date: endDate || null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        thumbnail_360_url: thumbnail360Url || null,
        is_published: isPublished,
      })
      .select("*")
      .single();

    if (error || !newEvent) {
      console.error(error);
      alert("Error creating event.");
      return;
    }

    // Unified relationships
    await replaceUnifiedRelationships(
      supabase,
      "event",
      newEvent.id,
      selectedRelationships
    );

    router.push(`/${citySlug}/events/${slug}/edit`);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Event</h1>

      <div className="space-y-8">
        <EventBasicsForm
          name={name}
          setName={setName}
          slug={slug}
          setSlug={setSlug}
          eventType={eventType}
          setEventType={setEventType}
          description={description}
          setDescription={setDescription}
          eventTypeOptions={[
            "Historical",
            "Cultural",
            "Political",
            "Weather",
            "Sports",
            "Entertainment",
            "Celestial",
          ]}
        />

        <EventDatesForm
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        <EventErasForm
          eras={eras}
          selectedEraIds={selectedEraIds}
          setSelectedEraIds={setSelectedEraIds}
        />

        <EventMetadataForm
          tags={tags}
          setTags={setTags}
          thumbnail360Url={thumbnail360Url}
          setThumbnail360Url={setThumbnail360Url}
          isPublished={isPublished}
          setIsPublished={setIsPublished}
        />

        <RelationshipSelector
          fromType="event"
          fromId={null}
          availableTargets={[
            { type: "entity", label: "Entities", items: entities },
            { type: "artifact", label: "Artifacts", items: artifacts },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={[]}
          onChange={setSelectedRelationships}
        />

        <div className="space-y-2">
  <label className="font-medium">Thumbnail 360° Image</label>
  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const filePath = `thumbnails/events/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("public")
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        alert("Error uploading thumbnail.");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("public")
        .getPublicUrl(filePath);

      setThumbnail360Url(urlData.publicUrl);
    }}
    className="border p-2 w-full"
  />

  {thumbnail360Url && (
    <img
      src={thumbnail360Url}
      alt="Thumbnail preview"
      className="w-48 h-auto rounded border"
    />
  )}
</div>

        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Event
        </button>

        <button
  onClick={() => router.push(`/${citySlug}/events`)}
  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
>
  Cancel
</button>
      </div>
    </div>
  );
}
