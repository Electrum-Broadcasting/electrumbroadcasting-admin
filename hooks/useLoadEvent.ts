"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { loadUnifiedRelationships } from "@/lib/joinTables";

export function useLoadEvent(citySlug: string, eventSlug: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [event, setEvent] = useState<any>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [tags, setTags] = useState("");
  const [thumbnail360Url, setThumbnail360Url] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Eras
  const [eras, setEras] = useState<any[]>([]);
  const [selectedEraIds, setSelectedEraIds] = useState<string[]>([]);

  // Relationship targets
  const [entities, setEntities] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Unified relationships
  const [existingRelationships, setExistingRelationships] = useState<any[]>([]);

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

      // Load event
      const { data: eventData } = await supabase
        .from("civic_events")
        .select("*")
        .eq("slug", eventSlug)
        .eq("city_id", city.id)
        .single();

      if (!eventData) {
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Populate form fields
      setName(eventData.name);
      setSlug(eventData.slug);
      setEventType(eventData.event_type || "");
      setDescription(eventData.description || "");
      setStartDate(eventData.start_date || "");
      setEndDate(eventData.end_date || "");
      setTags(eventData.tags?.join(", ") || "");
      setThumbnail360Url(eventData.thumbnail_360_url || "");
      setIsPublished(eventData.is_published);

      // Load eras
      const { data: eraList } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("city_id", city.id)
        .order("start_year", { ascending: true });

      setEras(eraList || []);
      setSelectedEraIds(eventData.era_ids || []);

      // Load entities
      const { data: entityList } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEntities(entityList || []);

      // Load artifacts
      const { data: artifactList } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setArtifacts(artifactList || []);

      // Load stories
      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setStories(storyList || []);

      // Unified relationships (READ)
      const unifiedRelationships = await loadUnifiedRelationships(
        supabase,
        "event",
        eventData.id
      );

      setExistingRelationships(unifiedRelationships || []);

      setLoading(false);
    }

    load();
  }, [citySlug, eventSlug]);

  return {
    loading,
    cityId,
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
    isPublished,
    setIsPublished,

    // Eras
    eras,
    selectedEraIds,
    setSelectedEraIds,

    // Relationship targets
    entities,
    artifacts,
    stories,

    // Unified relationships
    existingRelationships,
    setExistingRelationships,
  };
}
