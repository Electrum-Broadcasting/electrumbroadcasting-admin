"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

import { useCivicCreate } from "@/hooks/useCivicObjectMutation";
import { saveCivicLinks, saveCivicRelationships, type CivicRelationship } from "@/lib/admin/civicObjectClient";

import MomentBasicsForm from "@/components/moments/MomentBasicsForm";
import MomentTimelineForm from "@/components/moments/MomentTimelineForm";
import MomentSpatialForm from "@/components/moments/MomentSpatialForm";
import Moment360Form from "@/components/moments/Moment360Form";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

interface CreateMomentPageProps {
  params: {
    citySlug: string;
  };
}

export default function CreateMomentPage({ params }: CreateMomentPageProps) {
  const { citySlug } = params;
  const [supabase] = useState(createBrowserClient);
  const mutation = useCivicCreate("moment", citySlug, "moments");

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

  const [validationError, setValidationError] = useState<string | null>(null);

  // Relationships
  const [selectedRelationships, setSelectedRelationships] = useState<CivicRelationship[]>([]);

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
  }, [citySlug, supabase]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!cityId) return <div className="p-6">City not found.</div>;

  async function handleSave() {
    if (!momentTime.trim() || Number.isNaN(new Date(momentTime).getTime())) {
      setValidationError("Please enter a valid moment time.");
      return;
    }
    setValidationError(null);
    await mutation.create({
      title, ...(slug.trim() ? { slug } : {}), body, moment_time: new Date(momentTime).toISOString(),
      thumbnail_360_url: thumbnail360Url, inline_360_urls: inline360Urls,
    }, async (id) => {
      if (mutation.createdId || selectedEras.length) {
        await saveCivicLinks(supabase, "moment_eras", "moment_id", "era_id", id, selectedEras);
      }
      if (mutation.createdId || selectedPlaces.length) {
        await saveCivicLinks(supabase, "moment_places", "moment_id", "place_id", id, selectedPlaces);
      }
      if (mutation.createdId || selectedNeighborhoods.length) {
        await saveCivicLinks(supabase, "moment_neighborhoods", "moment_id", "neighborhood_id", id, selectedNeighborhoods);
      }
      if (mutation.createdId || selectedRelationships.length) {
        await saveCivicRelationships(supabase, "moment", id, selectedRelationships);
      }
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Moment</h1>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {validationError && <p role="alert">{validationError}</p>}
      <p>Moments are created pending and unpublished.</p>
      {mutation.createdId && <p>Metadata was saved. Only relationships will be retried.</p>}

      {/* Basics */}
      <fieldset disabled={!!mutation.createdId || mutation.busy || mutation.unconfirmed} className="space-y-6">
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
      </fieldset>

      {/* Spatial */}
      <fieldset disabled={mutation.busy || mutation.unconfirmed}><MomentSpatialForm
        places={places}
        selectedPlaces={selectedPlaces}
        setSelectedPlaces={setSelectedPlaces}
        neighborhoods={neighborhoods}
        selectedNeighborhoods={selectedNeighborhoods}
        setSelectedNeighborhoods={setSelectedNeighborhoods}
      /></fieldset>

      {/* 360° Media */}
      <fieldset disabled={!!mutation.createdId || mutation.busy || mutation.unconfirmed}>
      <Moment360Form
        thumbnail360Url={thumbnail360Url}
        setThumbnail360Url={setThumbnail360Url}
        inline360Urls={inline360Urls}
        setInline360Urls={setInline360Urls}
      />
      </fieldset>

      {/* Relationships */}
      <fieldset disabled={mutation.busy || mutation.unconfirmed}><RelationshipSelector
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
      /></fieldset>

      <button
        onClick={handleSave}
        disabled={mutation.busy || mutation.unconfirmed}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {mutation.busy ? "Saving…" : mutation.createdId ? "Retry Relationships" : "Create Moment"}
      </button>
    </div>
  );
}
