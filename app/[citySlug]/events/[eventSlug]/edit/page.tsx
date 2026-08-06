"use client";

import { useRouter } from "next/navigation";
import { useLoadEvent } from "@/hooks/useLoadEvent";
import { saveEvent } from "@/lib/events/saveEvent";

import EventBasicsForm from "@/components/events/EventBasicsForm";
import EventDatesForm from "@/components/events/EventDatesForm";
import EventErasForm from "@/components/events/EventErasForm";
import EventMetadataForm from "@/components/events/EventMetadataForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

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

      // Unified relationships
      existingRelationships,
    });
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
      </div>
    </div>
  );
}
