"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function toLocalInputFormat(ts: string | null): string {
  if (!ts) return "";

  // Convert any ISO timestamp into a valid datetime-local string
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function useEditMomentForm(citySlug: string, momentSlug: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);

  const [moment, setMoment] = useState<any>(null);
  const [cityId, setCityId] = useState<string | null>(null);

  // Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");

  // Timeline
    const [momentTime, setMomentTime] = useState<string>("");

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

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Unified relationships
  const [existingRelationships, setExistingRelationships] = useState<any[]>([]);

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
      // 2. Load moment
      //
      const { data: momentData } = await supabase
        .from("civic_moments")
        .select("*")
        .eq("slug", momentSlug)
        .eq("city_id", city.id)
        .single();

      if (!momentData) {
        setLoading(false);
        return;
      }

      setMoment(momentData);

      //
      // 3. Initialize basics
      //
      setTitle(momentData.title);
      setSlug(momentData.slug);
      setBody(momentData.body || "");

      //
      // 4. Initialize timeline
      //

      setMomentTime(toLocalInputFormat(momentData.moment_time));

      //
      // 5. Load metadata
      //
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

      //
      // 6. Load join tables
      //
      const { data: momentPlaces } = await supabase
        .from("moment_places")
        .select("place_id")
        .eq("moment_id", momentData.id);

      const { data: momentNeighborhoods } = await supabase
        .from("moment_neighborhoods")
        .select("neighborhood_id")
        .eq("moment_id", momentData.id);

      const { data: momentEras } = await supabase
        .from("moment_eras")
        .select("era_id")
        .eq("moment_id", momentData.id);

      setSelectedPlaces(momentPlaces?.map((r) => r.place_id) || []);
      setSelectedNeighborhoods(momentNeighborhoods?.map((r) => r.neighborhood_id) || []);
      setSelectedEras(momentEras?.map((r) => r.era_id) || []);

      //
      // 7. Media
      //
      setThumbnail360Url(momentData.thumbnail_360_url || "");
      setInline360Urls(momentData.inline_360_urls || []);

      //
      // 8. Publish
      //
      setIsPublished(momentData.is_published);

      //
      // 9. Relationship targets
      //
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

      //
      // 10. Unified relationships
      //
      const { data: relationships } = await supabase
        .from("civic_relationships")
        .select("*")
        .eq("from_type", "moment")
        .eq("from_id", momentData.id);

      setExistingRelationships(relationships || []);

      //
      // 11. Done
      //
      setLoading(false);
    }

    load();
  }, [citySlug, momentSlug]);

  return {
    loading,
    moment,
    cityId,

    title,
    setTitle,
    slug,
    setSlug,
    body,
    setBody,

    momentYear,
    setMomentYear,
    momentDate,
    setMomentDate,
    momentTime,
    setMomentTime,

    places,
    selectedPlaces,
    setSelectedPlaces,

    neighborhoods,
    selectedNeighborhoods,
    setSelectedNeighborhoods,

    eras,
    selectedEras,
    setSelectedEras,

    thumbnail360Url,
    setThumbnail360Url,
    inline360Urls,
    setInline360Urls,

    isPublished,
    setIsPublished,

    events,
    entities,
    artifacts,
    stories,

    existingRelationships,
  };
}
