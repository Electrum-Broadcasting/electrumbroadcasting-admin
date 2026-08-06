"use client";

import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";

import { useLoadMomentInitial } from "@/hooks/useLoadMomentInitial";
import { useMomentState } from "@/hooks/useMomentState";
import { saveMoment } from "@/lib/moments/saveMoment";

import MomentBasicsForm from "@/components/moments/MomentBasicsForm";
import MomentTimelineForm from "@/components/moments/MomentTimelineForm";
import MomentSpatialForm from "@/components/moments/MomentSpatialForm";
import Moment360Form from "@/components/moments/Moment360Form";
import MomentPublishForm from "@/components/moments/MomentPublishForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

interface EditMomentPageProps {
  params: {
    citySlug: string;
    momentSlug: string;
  };
}

export default function EditMomentPage({ params }: EditMomentPageProps) {
  const { citySlug, momentSlug } = params;
  const router = useRouter();

  const { loading, initialData } = useLoadMomentInitial(citySlug, momentSlug);

  // Always call hooks in the same order
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
    isPublished,
    setIsPublished,
    selectedRelationships,
    setSelectedRelationships,
  } = useMomentState(initialData);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!initialData || !initialData.moment)
    return <div className="p-6">Moment not found</div>;

  const moment = initialData.moment;

  async function handleSave() {
    await saveMoment({
      momentId: moment.id,
      citySlug,
      router,
      title,
      slug,
      body,
      momentTime,
      selectedPlaces,
      selectedNeighborhoods,
      thumbnail360Url,
      inline360Urls,
      isPublished,
      selectedEras,
      selectedRelationships,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Moment</h1>

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
      />

      <MomentSpatialForm
        places={initialData.places ?? []}
        selectedPlaces={selectedPlaces}
        setSelectedPlaces={
          setSelectedPlaces as (places: (string | number)[]) => void
        }
        neighborhoods={initialData.neighborhoods ?? []}
        selectedNeighborhoods={selectedNeighborhoods}
        setSelectedNeighborhoods={
          setSelectedNeighborhoods as (neighborhoods: (string | number)[]) => void
        }
      />

      <Moment360Form
        thumbnail360Url={thumbnail360Url}
        setThumbnail360Url={setThumbnail360Url}
        inline360Urls={inline360Urls}
        setInline360Urls={setInline360Urls}
      />

      <MomentPublishForm
        isPublished={isPublished}
        setIsPublished={setIsPublished}
      />

      <RelationshipSelector
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
      />

      <button
        onClick={() => {
          flushSync(() => {});
          handleSave();
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Moment
      </button>
    </div>
  );
}
