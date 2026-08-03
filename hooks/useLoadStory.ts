"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { loadUnifiedRelationships } from "@/lib/joinTables";

export function useLoadStory(citySlug: string, storySlug: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [story, setStory] = useState<any>(null);

  // Basics
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  // Hero Image
  const [heroImageUrl, setHeroImageUrl] = useState("");

  // 360° Visuals
  const [hero360Url, setHero360Url] = useState("");
  const [thumbnail360Url, setThumbnail360Url] = useState("");
  const [neighborhood360Url, setNeighborhood360Url] = useState("");
  const [inline360Urls, setInline360Urls] = useState<string[]>([]);

  // Metadata
  const [year, setYear] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  // Sponsorship
  const [sponsor360Url, setSponsor360Url] = useState("");
  const [sponsorFlatUrl, setSponsorFlatUrl] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorLink, setSponsorLink] = useState("");
  const [sponsorAltText, setSponsorAltText] = useState("");

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
      // City
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

      // Story
      const { data: storyData } = await supabase
        .from("civic_stories")
        .select("*")
        .eq("slug", storySlug)
        .eq("city_id", city.id)
        .single();

      if (!storyData) {
        setLoading(false);
        return;
      }

      setStory(storyData);

      // Populate fields
      setTitle(storyData.title);
      setSlug(storyData.slug);
      setSummary(storyData.summary || "");
      setBody(storyData.body || "");
      setCategory(storyData.category || "");
      setTags(storyData.tags?.join(", ") || "");

      setHeroImageUrl(storyData.hero_image_url || "");
      setHero360Url(storyData.hero_360_url || "");
      setThumbnail360Url(storyData.thumbnail_360_url || "");
      setNeighborhood360Url(storyData.neighborhood_360_url || "");
      setInline360Urls(storyData.inline_360_urls || []);

      setYear(storyData.year || null);
      setDateRange(storyData.date_range || "");
      setNeighborhood(storyData.neighborhood || "");

      setSponsor360Url(storyData.sponsor_360_url || "");
      setSponsorFlatUrl(storyData.sponsor_flat_url || "");
      setSponsorName(storyData.sponsor_name || "");
      setSponsorLink(storyData.sponsor_link || "");
      setSponsorAltText(storyData.sponsor_alt_text || "");

      setIsPublished(storyData.is_published);

      // Events
      const { data: eventList } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEvents(eventList || []);

      // Entities
      const { data: entityList } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name");

      setEntities(entityList || []);

      // Artifacts
      const { data: artifactList } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setArtifacts(artifactList || []);

      // Stories
      const { data: storyList } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id)
        .order("title");

      setStories(storyList || []);

      // Unified relationships (READ)
      const unifiedRelationships = await loadUnifiedRelationships(
        supabase,
        "story",
        storyData.id
      );

      setExistingRelationships(unifiedRelationships || []);

      setLoading(false);
    }

    load();
  }, [citySlug, storySlug]);

  return {
    loading,
    cityId,
    story,

    // Basics
    title,
    setTitle,
    slug,
    setSlug,
    summary,
    setSummary,
    body,
    setBody,
    category,
    setCategory,
    tags,
    setTags,

    // Hero
    heroImageUrl,
    setHeroImageUrl,

    // 360°
    hero360Url,
    setHero360Url,
    thumbnail360Url,
    setThumbnail360Url,
    neighborhood360Url,
    setNeighborhood360Url,
    inline360Urls,
    setInline360Urls,

    // Metadata
    year,
    setYear,
    dateRange,
    setDateRange,
    neighborhood,
    setNeighborhood,

    // Sponsor
    sponsor360Url,
    setSponsor360Url,
    sponsorFlatUrl,
    setSponsorFlatUrl,
    sponsorName,
    setSponsorName,
    sponsorLink,
    setSponsorLink,
    sponsorAltText,
    setSponsorAltText,

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
    setExistingRelationships,
  };
}
