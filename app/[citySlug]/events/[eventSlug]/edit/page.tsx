"use client";

import { useRouter } from "next/navigation";
import { useLoadEvent } from "@/hooks/useLoadEvent";
import { saveEvent } from "@/lib/events/saveEvent";
import { replaceUnifiedRelationships } from "@/lib/joinTables";

import EventBasicsForm from "@/components/events/EventBasicsForm";
import EventDatesForm from "@/components/events/EventDatesForm";
import EventErasForm from "@/components/events/EventErasForm";
import EventMetadataForm from "@/components/events/EventMetadataForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface EditEventPageParams {
  citySlug: string;
  eventSlug: string;
}

interface EditEventPageProps {
  params: EditEventPageParams;
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const { citySlug, eventSlug } = params;
  const router = useRouter();

  const {
    loading,
    event,
    cityId,

    // Form fields
    name,
    setName,
    slug,
    setSlug,
    eventType,
    setEventType,
    description,
    setDescription,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    tags,
    setTags,
    thumbnail360Url,
    setThumbnail360Url,
    isPublished,
    setIsPublished,

    // Eras
    eras,
    selectedEraIds,
    setSelectedEraIds,

    // Relationships
    entities,
    artifacts,
    stories,
    existingRelationships,
    setExistingRelationships,
  } = useLoadEvent(citySlug, eventSlug);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!event) return <div className="p-6">Event not found</div>;

  async function handleSave() {
    await saveEvent({
      eventId: event.id,
      citySlug,
      router,

      // Form fields
      name,
      slug,
      eventType,
      description,
      startDate,
      endDate,
      tags,
      thumbnail360Url,
      isPublished,

      // Eras
      eras,
      selectedEraIds,

      // Relationships
      existingRelationships,
    });

    // Save unified relationships
    await replaceUnifiedRelationships(
      supabase,
      "event",
      event.id,
      existingRelationships
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Event</h1>

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
          fromId={event.id}
          availableTargets={[
            { type: "entity", label: "Entities", items: entities },
            { type: "artifact", label: "Artifacts", items: artifacts },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={existingRelationships}
          onChange={setExistingRelationships}
        />

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>

        <button
          onClick={async () => {
            if (!confirm("Are you sure you want to delete this Event? This cannot be undone.")) {
              return;
            }

            const { error } = await supabase
              .from("civic_events")
              .delete()
              .eq("id", event.id);

            if (error) {
              console.error(error);
              alert("Error deleting event.");
              return;
            }

            router.push(`/${citySlug}/events`);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete Event
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
