"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { loadUnifiedRelationships } from "@/lib/joinTables";

export function useLoadEntity(citySlug: string, entitySlug: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [entity, setEntity] = useState<any>(null);
  const [roles, setRoles] = React.useState(entity?.roles ?? "");

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [entityType, setEntityType] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [hero360Url, setHero360Url] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Unified relationships
  const [existingRelationships, setExistingRelationships] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
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

      const { data: entityData } = await supabase
        .from("civic_entities")
        .select("*")
        .eq("slug", entitySlug)
        .eq("city_id", city.id)
        .single();

      if (!entityData) {
        setLoading(false);
        return;
      }

      setEntity(entityData);

      setName(entityData.name);
      setSlug(entityData.slug);
      setEntityType(entityData.entity_type || "");
      setSummary(entityData.summary || "");
      setDescription(entityData.description || "");
      setHeroImageUrl(entityData.hero_image_url || "");
      setHero360Url(entityData.hero_360_url || "");
      setThumbnailUrl(entityData.thumbnail_url || "");
      setMediaUrls(entityData.media_urls || []);
      setIsPublished(entityData.is_published);
      setRoles(entityData.roles || "");

      const { data: eventList } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEvents(eventList || []);

      const { data: artifactList } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setArtifacts(artifactList || []);

      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setStories(storyList || []);

      const unifiedRelationships = await loadUnifiedRelationships(
        supabase,
        "entity",
        entityData.id
      );

      setExistingRelationships(unifiedRelationships || []);

      setLoading(false);
    }

    load();
  }, [citySlug, entitySlug]);

  return {
    loading,
    entity,
    cityId,

    // Form fields
    name,
    setName,
    slug,
    setSlug,
    entityType,
    setEntityType,
    summary,
    setSummary,
    description,
    setDescription,
    heroImageUrl,
    setHeroImageUrl,
    hero360Url,
    setHero360Url,
    thumbnailUrl,
    setThumbnailUrl,
    mediaUrls,
    setMediaUrls,
    isPublished,
    setIsPublished,
    roles,
    setRoles,

    // Relationship targets
    events,
    artifacts,
    stories,

    // Unified relationships
    existingRelationships,
    setExistingRelationships,
  };
}
