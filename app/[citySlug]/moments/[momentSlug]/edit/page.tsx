"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

import { useLoadMomentInitial } from "@/hooks/useLoadMomentInitial";
import { useMomentState } from "@/hooks/useMomentState";
import { useCivicEdit } from "@/hooks/useCivicObjectMutation";
import { CivicRequestError, saveCivicRelationships } from "@/lib/admin/civicObjectClient";
import { createMomentRelationshipSaver } from "@/lib/moments/relationshipClient";
import CivicLifecycleControls from "@/components/admin/CivicLifecycleControls";


import MomentBasicsForm from "@/components/moments/MomentBasicsForm";
import MomentTimelineForm from "@/components/moments/MomentTimelineForm";
import MomentSpatialForm from "@/components/moments/MomentSpatialForm";
import Moment360Form from "@/components/moments/Moment360Form";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

interface EditMomentPageProps {
  params: {
    citySlug: string;
    momentSlug: string;
  };
}

export default function EditMomentPage({ params }: EditMomentPageProps) {
  const { citySlug, momentSlug } = params;
  const { loading, initialData } = useLoadMomentInitial(citySlug, momentSlug);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!initialData || !initialData.moment)
    return <div className="p-6">Moment not found</div>;

  return (
    <EditMomentForm
      key={`${citySlug}/${momentSlug}`}
      citySlug={citySlug}
      initialData={initialData}
    />
  );
}

function EditMomentForm({
  citySlug,
  initialData,
}: {
  citySlug: string;
  initialData: any;
}) {
  const router = useRouter();
  const [supabase] = useState(createBrowserClient);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [relationshipSaver] = useState(createMomentRelationshipSaver);
  const [relationshipPending, setRelationshipPending] = useState(false);
  const [relationshipMessage, setRelationshipMessage] = useState<string | null>(null);
  const {
    title,
    setTitle,
    slug,
    setSlug,
    body,
    setBody,
    momentTime,
    setMomentTime,
    selectedPlaces,
    setSelectedPlaces,
    selectedNeighborhoods,
    setSelectedNeighborhoods,
    selectedEras,
    setSelectedEras,
    thumbnail360Url,
    setThumbnail360Url,
    inline360Urls,
    setInline360Urls,
    selectedRelationships,
    setSelectedRelationships,
  } = useMomentState(initialData);

  const moment = initialData.moment;
  const mutation = useCivicEdit("moment", moment.id, citySlug, "moments");

  async function handleSave() {
    if (!momentTime.trim() || Number.isNaN(new Date(momentTime).getTime())) {
      setValidationError("Please enter a valid moment time.");
      return;
    }
    setValidationError(null);
    await mutation.save({
      title, slug, body, moment_time: new Date(momentTime).toISOString(),
      thumbnail_360_url: thumbnail360Url, inline_360_urls: inline360Urls,
    });
  }

  async function handleRelationships() {
    if (!initialData.relationshipsLoaded || !initialData.momentRelationships) return;
    await mutation.saveLinks(async () => {
      setRelationshipMessage(null);
      try {
        const result = await relationshipSaver.save(moment.id, initialData.cityId, {
          ...initialData.momentRelationships,
          eras: selectedEras.map((id) => ({ id })),
          places: selectedPlaces.map((id) => ({ id })),
          neighborhoods: selectedNeighborhoods.map((id) => ({ id })),
        });
        setRelationshipPending(false);
        setRelationshipMessage(result.changed ? `Moment relationships saved. Audit ID: ${result.auditId}` : "Moment relationships unchanged.");
      } catch (error) {
        setRelationshipPending(relationshipSaver.hasPending());
        throw error;
      }
      try {
        await saveCivicRelationships(supabase, "moment", moment.id, selectedRelationships);
      } catch (error) {
        console.error("Failed to save Moment civic graph:", error);
        throw new CivicRequestError("Moment relationships saved, but civic graph relationships may not have saved. Retry relationships.");
      }
      relationshipSaver.clearCompleted();
    });
  }
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Moment</h1>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {validationError && <p role="alert">{validationError}</p>}
      {!initialData.relationshipsLoaded && <p role="alert">{initialData.relationshipsError || "Unable to load relationships."} Relationship changes are disabled.</p>}
      {mutation.message && <p role="status">{mutation.message}</p>}
      {relationshipMessage && <p role="status">{relationshipMessage}</p>}
      <p>Metadata and relationships are saved separately.</p>
      <CivicLifecycleControls {...mutation} busy={mutation.busy || relationshipPending} />

      <MomentBasicsForm
        title={title}
        setTitle={setTitle}
        slug={slug}
        setSlug={setSlug}
        body={body}
        setBody={setBody}
      />

      <MomentTimelineForm
        momentTime={momentTime}
        setMomentTime={setMomentTime}
        eras={initialData.erasTargets ?? []}
        selectedEras={selectedEras}
        setSelectedEras={setSelectedEras}
        relationshipsDisabled={!initialData.relationshipsLoaded || mutation.busy || mutation.unconfirmed || relationshipPending || !mutation.actions?.canEdit}
      />

      <fieldset disabled={!initialData.relationshipsLoaded || mutation.busy || mutation.unconfirmed || relationshipPending || !mutation.actions?.canEdit}>
      <MomentSpatialForm
        places={initialData.places ?? []}
        selectedPlaces={selectedPlaces}
        setSelectedPlaces={setSelectedPlaces}
        neighborhoods={initialData.neighborhoods ?? []}
        selectedNeighborhoods={selectedNeighborhoods}
        setSelectedNeighborhoods={setSelectedNeighborhoods}
      />
      </fieldset>

      <Moment360Form
        thumbnail360Url={thumbnail360Url}
        setThumbnail360Url={setThumbnail360Url}
        inline360Urls={inline360Urls}
        setInline360Urls={setInline360Urls}
      />

      {initialData.relationshipsLoaded && <fieldset disabled={mutation.busy || mutation.unconfirmed || relationshipPending || !mutation.actions?.canEdit}><RelationshipSelector
        fromType="moment"
        fromId={moment.id}
        availableTargets={[
          { type: "event", label: "Events", items: initialData.events },
          { type: "entity", label: "Entities", items: initialData.entities },
          { type: "artifact", label: "Artifacts", items: initialData.artifacts },
          { type: "story", label: "Stories", items: initialData.stories },
        ]}
        initialRelationships={initialData.relationships}
        onChange={setSelectedRelationships}
      /></fieldset>}

      {mutation.actions?.canEdit && <button
        onClick={handleSave}
        disabled={mutation.busy || mutation.unconfirmed || relationshipPending}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Metadata
      </button>}
      {mutation.actions?.canEdit && initialData.relationshipsLoaded && <button
        onClick={handleRelationships}
        disabled={mutation.busy || mutation.unconfirmed}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >{relationshipPending ? "Retry Relationships" : "Save Relationships"}</button>}
      <button onClick={() => {
        if (!relationshipPending || confirm("The Moment relationship save is unconfirmed. Leaving loses its retry key. Leave anyway?")) {
          router.push(`/${citySlug}/moments`);
        }
      }}>Cancel</button>
    </div>
  );
}
