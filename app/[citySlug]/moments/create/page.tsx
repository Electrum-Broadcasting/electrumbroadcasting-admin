"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

import MomentBasicsForm from "@/components/moments/MomentBasicsForm";
import MomentTimelineForm from "@/components/moments/MomentTimelineForm";
import MomentSpatialForm from "@/components/moments/MomentSpatialForm";
import Moment360Form from "@/components/moments/Moment360Form";
import MomentPublishForm from "@/components/moments/MomentPublishForm";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

import {
  replaceJoinTable,
  replaceUnifiedRelationships,
} from "@/lib/joinTables";

function nowLocalDatetime() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function CreateMomentPage({ params }) {
  const { citySlug } = params;
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  // Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");

  // Timeline
  const [momentTime, setMomentTime] = useState(nowLocalDatetime());

  // Metadata
  const [places, setPlaces] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [eras, setEras] = useState<any[]>([]);

  // Selections
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedEras, setSelectedEras] = useState<string[]>([]);

  // Media
  const [thumbnail360Url, setThumbnail360Url] = useState("");
  const [inline360Urls, setInline360Urls] = useState<string[]>([]);

  // Publish
  const [isPublished, setIsPublished] = useState(false);

  // Relationships
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      // Load city
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

      // Metadata
      const { data: placeList } = await supabase
        .from("civic_places")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      const { data: neighborhoodList } = await supabase
        .from("civic_neighborhoods")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      const { data: eraList } = await supabase
        .from("civic_eras")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setPlaces(placeList || []);
      setNeighborhoods(neighborhoodList || []);
      setEras(eraList || []);

      // Relationship targets
      const { data: eventList } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: entityList } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: artifactList } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id);

      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id);

      setEvents(eventList || []);
      setEntities(entityList || []);
      setArtifacts(artifactList || []);
      setStories(storyList || []);

      setLoading(false);
    }

    load();
  }, [citySlug]);

  function toTimestampZ(local: string): string | null {
    if (!local) return null;
    return new Date(local).toISOString();
  }

  async function handleCreate() {
    if (!cityId) return;

    // Insert moment
    const { data: inserted, error } = await supabase
      .from("civic_moments")
      .insert({
        city_id: cityId,
        title,
        slug,
        body,
        moment_time: toTimestampZ(momentTime),
        thumbnail_360_url: thumbnail360Url,
        inline_360_urls: inline360Urls,
        is_published: isPublished,
      })
      .select()
      .single();

    if (error) {
      console.error("Moment creation failed:", error);
      return;
    }

    const momentId = inserted.id;

    // Spatial join tables
    await replaceJoinTable(
      supabase,
      "moment_places",
      momentId,
      "place_id",
      selectedPlaces
    );

    await replaceJoinTable(
      supabase,
      "moment_neighborhoods",
      momentId,
      "neighborhood_id",
      selectedNeighborhoods
    );

    await replaceJoinTable(
      supabase,
      "moment_eras",
      momentId,
      "era_id",
      selectedEras
    );

    // Unified relationships
    await replaceUnifiedRelationships(
      supabase,
      "moment",
      momentId,
      relationships
    );

    router.push(`/${citySlug}/moments/${slug}/edit`);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Moment</h1>

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
        eras={eras}
        selectedEras={selectedEras}
        setSelectedEras={setSelectedEras}
      />

      <MomentSpatialForm
        places={places}
        selectedPlaces={selectedPlaces}
        setSelectedPlaces={setSelectedPlaces}
        neighborhoods={neighborhoods}
        selectedNeighborhoods={selectedNeighborhoods}
        setSelectedNeighborhoods={setSelectedNeighborhoods}
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
        fromId={null} // Create page: no ID yet
        availableTargets={[
          { type: "event", label: "Events", items: events },
          { type: "entity", label: "Entities", items: entities },
          { type: "artifact", label: "Artifacts", items: artifacts },
          { type: "story", label: "Stories", items: stories },
        ]}
        initialRelationships={[]}
        onChange={setRelationships}
      />

      <button
        onClick={handleCreate}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Create Moment
      </button>
    </div>
  );
}
