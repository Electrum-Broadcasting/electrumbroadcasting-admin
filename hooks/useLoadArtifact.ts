"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { loadUnifiedRelationships } from "@/lib/joinTables";

export function useLoadArtifact(citySlug: string, artifactSlug: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<any>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [artifactType, setArtifactType] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
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
      // 2. Load artifact
      //
      const { data: artifactData } = await supabase
        .from("civic_artifacts")
        .select("*")
        .eq("slug", artifactSlug)
        .eq("city_id", city.id)
        .single();

      if (!artifactData) {
        setLoading(false);
        return;
      }

      setArtifact(artifactData);

      //
      // 3. Populate fields
      //
      setTitle(artifactData.title);
      setSlug(artifactData.slug);
      setDescription(artifactData.description || "");
      setArtifactType(artifactData.artifact_type || "");
      setThumbnailUrl(artifactData.thumbnail_url || "");
      setIsPublished(artifactData.is_published);

      //
      // 4. Load relationship targets
      //
      const { data: eventList } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      setEvents(eventList || []);

      const { data: entityList } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      setEntities(entityList || []);

      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title", { ascending: true });

      setStories(storyList || []);

      //
      // 5. Load unified relationships (READ ONLY)
      //
      const unifiedRelationships = await loadUnifiedRelationships(
        supabase,
        "artifact",
        artifactData.id
      );

      setExistingRelationships(unifiedRelationships || []);

      setLoading(false);
    }

    load();
  }, [citySlug, artifactSlug]);

  return {
    loading,
    artifact,
    cityId,

    // Form fields
    title,
    setTitle,
    slug,
    setSlug,
    description,
    setDescription,
    artifactType,
    setArtifactType,
    thumbnailUrl,
    setThumbnailUrl,
    isPublished,
    setIsPublished,

    // Relationship targets
    events,
    entities,
    stories,

    // Unified relationships
    existingRelationships,
  };
}
