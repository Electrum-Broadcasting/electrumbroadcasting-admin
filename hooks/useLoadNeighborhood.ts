"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useLoadNeighborhood(citySlug: string, neighborhoodSlug: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<any>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);

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

      // Load neighborhood
      const { data: neighborhoodData } = await supabase
        .from("civic_neighborhoods")
        .select("*")
        .eq("slug", neighborhoodSlug)
        .eq("city_id", city.id)
        .single();

      if (!neighborhoodData) {
        setLoading(false);
        return;
      }

      setNeighborhood(neighborhoodData);

      // Populate fields
      setName(neighborhoodData.name);
      setSlug(neighborhoodData.slug);
      setDescription(neighborhoodData.description || "");
      setThumbnailUrl(neighborhoodData.thumbnail_url || "");
      setIsPublished(neighborhoodData.is_published);

      setLoading(false);
    }

    load();
  }, [citySlug, neighborhoodSlug]);

  return {
    loading,
    neighborhood,
    cityId,

    name,
    setName,
    slug,
    setSlug,
    description,
    setDescription,
    thumbnailUrl,
    setThumbnailUrl,
    isPublished,
    setIsPublished,
  };
}
