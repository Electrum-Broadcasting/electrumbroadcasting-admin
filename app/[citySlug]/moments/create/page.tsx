"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { createBrowserClient } from "@supabase/ssr";

import { saveMoment } from "@/lib/moments/saveMoment";

import MomentBasicsForm from "@/components/moments/MomentBasicsForm";
import MomentTimelineForm from "@/components/moments/MomentTimelineForm";
import MomentSpatialForm from "@/components/moments/MomentSpatialForm";
import Moment360Form from "@/components/moments/Moment360Form";
import MomentPublishForm from "@/components/moments/MomentPublishForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

interface CreateMomentPageProps {
  params: {
    citySlug: string;
  };
}

export default function CreateMomentPage({ params }: CreateMomentPageProps) {
  const { citySlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  // Metadata / targets
  const [places, setPlaces] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [erasTargets, setErasTargets] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");

  // Timeline (only moment_time exists in schema)
  const [momentTime, setMomentTime] = useState<string>("");

  // Spatial selections
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  // Eras selections
  const [selectedEras, setSelectedEras] = useState<string[]>([]);

  // Media
  const [thumbnail360Url, setThumbnail360Url] = useState("");
  const [inline360Urls, setInline360Urls] = useState<string[]>([]);

  // Publish
  const [isPublished, setIsPublished] = useState(false);

  // Relationships
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
      // 2. Load spatial metadata
      //
      const { data: placesData } = await supabase
        .from("civic_places")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: neighborhoodsData } = await supabase
        .from("civic_neighborhoods")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: erasData } = await supabase
        .from("civic_eras")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      //
      // 3. Load relationship targets
      //
      const { data: eventsData } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: entitiesData } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: artifactsData } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id);

      const { data: storiesData } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id);

      setPlaces(placesData || []);
      setNeighborhoods(neighborhoodsData || []);
      setErasTargets(erasData || []);
      setEvents(eventsData || []);
      setEntities(entitiesData || []);
      setArtifacts(artifactsData || []);
      setStories(storiesData || []);

      setLoading(false);
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!cityId) return <div className="p-6">City not found.</div>;

  async function handleSave() {
    console.log("Creating moment…");

    await saveMoment({
      momentId: null, // creation; implementation in saveMoment can handle this
      citySlug,
      router,

      // Basics
      title,
      slug,
      body,

      // Timeline
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
      selectedRelationships,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Moment</h1>

      {/* Basics */}
      <MomentBasicsForm
        title={title}
        setTitle={setTitle}
        slug={slug}
        setSlug={setSlug}
        body={body}
        setBody={setBody}
      />

      {/* Timeline */}
      <MomentTimelineForm
        momentTime={momentTime}
        setMomentTime={setMomentTime}
        eras={erasTargets}
        selectedEras={selectedEras}
        setSelectedEras={setSelectedEras}
      />

      {/* Spatial */}
      <MomentSpatialForm
        places={places}
        selectedPlaces={selectedPlaces}
        setSelectedPlaces={setSelectedPlaces as (places: (string | number)[]) => void}
        neighborhoods={neighborhoods}
        selectedNeighborhoods={selectedNeighborhoods}
        setSelectedNeighborhoods={
          setSelectedNeighborhoods as (neighborhoods: (string | number)[]) => void
        }
      />

      {/* 360° Media */}
      <Moment360Form
        thumbnail360Url={thumbnail360Url}
        setThumbnail360Url={setThumbnail360Url}
        inline360Urls={inline360Urls}
        setInline360Urls={setInline360Urls}
      />

      {/* Publish */}
      <MomentPublishForm
        isPublished={isPublished}
        setIsPublished={setIsPublished}
      />

      {/* Relationships */}
      <RelationshipSelector
        fromType="moment"
        fromId={null}
        availableTargets={[
          { type: "event", label: "Events", items: events },
          { type: "entity", label: "Entities", items: entities },
          { type: "artifact", label: "Artifacts", items: artifacts },
          { type: "story", label: "Stories", items: stories },
        ]}
        initialRelationships={[]}
        onChange={setSelectedRelationships}
      />

      <button
        onClick={() => {
          flushSync(() => {});
          handleSave();
        }}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Save Moment
      </button>
    </div>
  );
}
