"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLoadEvent } from "@/hooks/useLoadEvent";
import { useCivicEdit } from "@/hooks/useCivicObjectMutation";
import { saveCivicLinks, saveCivicRelationships } from "@/lib/admin/civicObjectClient";
import CivicLifecycleControls from "@/components/admin/CivicLifecycleControls";

import EventBasicsForm from "@/components/events/EventBasicsForm";
import EventDatesForm from "@/components/events/EventDatesForm";
import EventErasForm from "@/components/events/EventErasForm";
import EventMetadataForm from "@/components/events/EventMetadataForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

import { createBrowserClient } from "@/lib/supabase/client";

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
  const [supabase] = useState(createBrowserClient);

  const {
    loading,
    event,

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
    relationshipsLoaded,
    relationshipsError,
  } = useLoadEvent(citySlug, eventSlug);
  const mutation = useCivicEdit("event", event?.id ?? null, citySlug, "events");

  if (loading) return <div className="p-6">Loading…</div>;
  if (!event) return <div className="p-6">Event not found</div>;

  async function handleSave() {
    await mutation.save({
      name, slug, event_type: eventType, description, start_date: startDate || null,
      end_date: endDate || null, tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      thumbnail_360_url: thumbnail360Url || null,
    });
  }

  async function handleRelationships() {
    if (!relationshipsLoaded) return;
    await mutation.saveLinks(async () => {
      const startYear = startDate ? new Date(startDate).getFullYear() : null;
      const endYear = endDate ? new Date(endDate).getFullYear() : startYear;
      const automatic = startYear && endYear ? eras.filter((era) =>
        startYear <= (era.end_year ?? 9999) && endYear >= era.start_year
      ).map((era) => era.id) : [];
      await saveCivicLinks(supabase, "event_eras", "event_id", "era_id", event.id, Array.from(new Set([...selectedEraIds, ...automatic])));
      await saveCivicRelationships(supabase, "event", event.id, existingRelationships);
    });
  }
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Event</h1>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {relationshipsError && <p role="alert">{relationshipsError}</p>}
      {mutation.message && <p role="status">{mutation.message}</p>}
      <p>Metadata and relationships are saved separately.</p>
      <CivicLifecycleControls {...mutation} />

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

        <fieldset disabled={!relationshipsLoaded || mutation.busy || mutation.unconfirmed || !mutation.actions?.canEdit}>
        <EventErasForm
          eras={eras}
          selectedEraIds={selectedEraIds}
          setSelectedEraIds={setSelectedEraIds}
        />
        </fieldset>

        <EventMetadataForm
          tags={tags}
          setTags={setTags}
          thumbnail360Url={thumbnail360Url}
          setThumbnail360Url={setThumbnail360Url}
        />

        {relationshipsLoaded && <fieldset disabled={mutation.busy || mutation.unconfirmed || !mutation.actions?.canEdit}><RelationshipSelector
          fromType="event"
          fromId={event.id}
          availableTargets={[
            { type: "entity", label: "Entities", items: entities },
            { type: "artifact", label: "Artifacts", items: artifacts },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={existingRelationships}
          onChange={setExistingRelationships}
        /></fieldset>}

        {mutation.actions?.canEdit && <button
          onClick={handleSave}
          disabled={mutation.busy || mutation.unconfirmed}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Metadata
        </button>}

        {mutation.actions?.canEdit && relationshipsLoaded && <button
          onClick={handleRelationships}
          disabled={mutation.busy || mutation.unconfirmed}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >Save Relationships</button>}

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
