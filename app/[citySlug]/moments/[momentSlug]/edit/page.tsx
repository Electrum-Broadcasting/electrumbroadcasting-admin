"use client";

import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";

import { useEditMomentForm } from "@/lib/moments/useEditMomentForm";
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

  // Load everything once — moment, metadata, join tables, relationships, and initialize state
  const {
    loading,
    moment,
    cityId,

    // Basics
    title,
    setTitle,
    slug,
    setSlug,
    body,
    setBody,

    // Timeline
    momentYear,
    setMomentYear,
    momentDate,
    setMomentDate,
    momentTime,
    setMomentTime,

    // Spatial metadata
    places,
    neighborhoods,
    eras,

    // Spatial selections
    selectedPlaces,
    setSelectedPlaces,
    selectedNeighborhoods,
    setSelectedNeighborhoods,

    // Eras selections
    selectedEras,
    setSelectedEras,

    // Media
    thumbnail360Url,
    setThumbnail360Url,
    inline360Urls,
    setInline360Urls,

    // Publish
    isPublished,
    setIsPublished,

    // Relationship targets
    events,
    entities,
    artifacts,
    stories,

    // Unified relationships
    existingRelationships,
  } = useEditMomentForm(citySlug, momentSlug);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!moment) return <div className="p-6">Moment not found</div>;

  async function handleSave() {
    console.log("handleSave executing");

    await saveMoment({
      momentId: moment.id,
      citySlug,
      router,

      // Basics
      title,
      slug,
      body,

      // Timeline
      momentYear,
      momentDate,
      momentTime,

      // Spatial
      selectedPlaces,
      selectedNeighborhoods,

      // Media
      thumbnail360Url,
      inline360Urls,

      // Publish
      isPublished,

      // Eras
      selectedEras,

      // Unified relationships
      existingRelationships,
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
        momentYear={momentYear}
        setMomentYear={setMomentYear}
        momentDate={momentDate}
        setMomentDate={setMomentDate}
        momentTime={momentTime}
        setMomentTime={setMomentTime}
        eras={eras ?? []}
        selectedEras={selectedEras}
        setSelectedEras={setSelectedEras}
      />

      <MomentSpatialForm
        places={places ?? []}
        selectedPlaces={selectedPlaces}
        setSelectedPlaces={setSelectedPlaces as (places: (string | number)[]) => void}
        neighborhoods={neighborhoods ?? []}
        selectedNeighborhoods={selectedNeighborhoods}
        setSelectedNeighborhoods={setSelectedNeighborhoods as (neighborhoods: (string | number)[]) => void}
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
          { type: "event", label: "Events", items: events },
          { type: "entity", label: "Entities", items: entities },
          { type: "artifact", label: "Artifacts", items: artifacts },
          { type: "story", label: "Stories", items: stories },
        ]}
        initialRelationships={existingRelationships}
        onChange={setSelectedRelationships}
      />

      <button
        onClick={() => {
          console.log("Save button clicked");
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
