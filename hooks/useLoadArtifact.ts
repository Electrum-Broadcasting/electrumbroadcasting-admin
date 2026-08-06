"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export function useLoadArtifact(citySlug: string, artifactSlug: string) {
  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState<any>(null);

  // Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [artifactType, setArtifactType] = useState("");

  // Metadata
  const [year, setYear] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  // Thumbnail
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Media
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  // Publish
  const [isPublished, setIsPublished] = useState(false);

  // Relationship targets
  const [events, setEvents] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Unified relationships
  const [existingRelationships, setExistingRelationships] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Load artifact directly using city_slug + artifact_slug
      const { data: artifactData, error: artifactError } = await supabase
        .from("civic_artifacts")
        .select("*")
        .eq("city_slug", citySlug)
        .eq("slug", artifactSlug)
        .single();

      console.log("artifactError:", artifactError);
      console.log("artifactData:", artifactData);

      if (!artifactData) {
        setArtifact(null);
        setLoading(false);
        return;
      }

      setArtifact(artifactData);

      // Populate form fields
      setTitle(artifactData.title ?? "");
      setSlug(artifactData.slug ?? "");
      setDescription(artifactData.description ?? "");
      setArtifactType(artifactData.artifact_type ?? "");

      setYear(artifactData.year ?? null);
      setTags(artifactData.tags ?? []);

      setThumbnailUrl(artifactData.thumbnail_url ?? null);

      setHeroImageUrl(artifactData.hero_image_url ?? null);
      setMediaUrls(artifactData.media_urls ?? []);

      setIsPublished(artifactData.is_published ?? false);

      // Relationship targets by city_slug
      const [{ data: eventData }, { data: entityData }, { data: storyData }] =
        await Promise.all([
          supabase.from("civic_events").select("*").eq("city_slug", citySlug),
          supabase.from("civic_entities").select("*").eq("city_slug", citySlug),
          supabase.from("civic_stories").select("*").eq("city_slug", citySlug),
        ]);

      setEvents(eventData ?? []);
      setEntities(entityData ?? []);
      setStories(storyData ?? []);

      // Existing relationships
      const { data: relData } = await supabase
        .from("civic_relationships")
        .select("*")
        .eq("from_type", "artifact")
        .eq("from_id", artifactData.id);

      setExistingRelationships(relData ?? []);

      setLoading(false);
    }

    load();
  }, [citySlug, artifactSlug]);

  return {
    loading,
    artifact,

    // Basics
    title,
    setTitle,
    slug,
    setSlug,
    description,
    setDescription,
    artifactType,
    setArtifactType,

    // Metadata
    year,
    setYear,
    tags,
    setTags,

    // Thumbnail
    thumbnailUrl,
    setThumbnailUrl,

    // Media
    heroImageUrl,
    setHeroImageUrl,
    mediaUrls,
    setMediaUrls,

    // Publish
    isPublished,
    setIsPublished,

    // Relationship targets
    events,
    entities,
    stories,

    // Unified relationships
    existingRelationships,
    setExistingRelationships,
  };
}
