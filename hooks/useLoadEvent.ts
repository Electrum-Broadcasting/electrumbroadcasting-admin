"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export function useLoadEvent(citySlug: string, eventSlug: string) {
  const [supabase] = useState(createBrowserClient);

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
  const [relationshipsLoaded, setRelationshipsLoaded] = useState(false);
  const [relationshipsError, setRelationshipsError] = useState<string | null>(null);

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
      const { data: eventEras, error: eventErasError } = await supabase
        .from("event_eras").select("era_id").eq("event_id", eventData.id);
      const invalidEraLinks = eventEras?.some((row) => typeof row.era_id !== "string" || !row.era_id);
      if (!eventErasError && !invalidEraLinks) setSelectedEraIds((eventEras || []).map((row) => row.era_id));

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
      const { data: unifiedRelationships, error: relationshipError } = await supabase
        .from("civic_relationships").select("*").eq("from_type", "event").eq("from_id", eventData.id);
      if (eventErasError || relationshipError || invalidEraLinks) {
        console.error("Failed to load Event relationships:", eventErasError || relationshipError || "Invalid Event era link");
        setRelationshipsError("Unable to load relationships. Relationship changes are disabled.");
      } else {
        setExistingRelationships(unifiedRelationships || []);
        setRelationshipsLoaded(true);
      }

      setLoading(false);
    }

    load();
  }, [citySlug, eventSlug, supabase]);

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
    relationshipsLoaded,
    relationshipsError,
  };
}
