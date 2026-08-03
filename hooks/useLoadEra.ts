"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useLoadEra(citySlug: string, eraSlug: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [era, setEra] = useState<any>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [startYear, setStartYear] = useState<number | null>(null);
  const [endYear, setEndYear] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);

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

      // Era
      const { data: eraData } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("slug", eraSlug)
        .eq("city_id", city.id)
        .single();

      if (!eraData) {
        setLoading(false);
        return;
      }

      setEra(eraData);

      // Populate fields
      setName(eraData.name);
      setSlug(eraData.slug);
      setStartYear(eraData.start_year);
      setEndYear(eraData.end_year);
      setDescription(eraData.description || "");
      setIsPublished(eraData.is_published);

      setLoading(false);
    }

    load();
  }, [citySlug, eraSlug]);

  return {
    loading,
    era,
    cityId,

    name,
    setName,
    slug,
    setSlug,
    startYear,
    setStartYear,
    endYear,
    setEndYear,
    description,
    setDescription,
    isPublished,
    setIsPublished,
  };
}
