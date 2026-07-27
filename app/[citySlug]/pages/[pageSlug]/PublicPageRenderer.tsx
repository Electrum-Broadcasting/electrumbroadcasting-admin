"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Module renderers
import StoryModuleEditor from "./modules/StoryModuleEditor";
import PlaceModuleEditor from "./modules/PlaceModuleEditor";
import EntityModuleEditor from "./modules/EntityModuleEditor";
import ArtifactModuleEditor from "./modules/ArtifactModuleEditor";
import NeighborhoodModuleEditor from "./modules/NeighborhoodModuleEditor";
import MomentModuleEditor from "./modules/MomentModuleEditor";
import EraModuleEditor from "./modules/EraModuleEditor";
import EventModuleEditor from "./modules/EventModuleEditor";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ModuleConfig {
  type: string;
  [key: string]: any;
}

interface PageData {
  title: string;
  modules?: ModuleConfig[];
  [key: string]: any;
}

export default function PublicPageRenderer({ params }: { params: { citySlug: string; pageSlug: string } }) {
  const citySlug = params.citySlug;
  const pageSlug = params.pageSlug;

  const [city, setCity] = useState<any>(null);
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCityAndPage() {
      // 1. Load city by slug
      const { data: cityData, error: cityError } = await supabase
        .from("cities")
        .select("*")
        .eq("slug", citySlug)
        .single();

      if (cityError || !cityData) {
        console.error("City not found:", citySlug);
        setLoading(false);
        return;
      }

      setCity(cityData);

      // 2. Load page from city_brand_settings
      const { data: brandData, error: brandError } = await supabase
        .from("city_brand_settings")
        .select("pages")
        .eq("city_id", cityData.id)
        .single();

      if (brandError || !brandData) {
        console.error("Brand settings not found for city:", citySlug);
        setLoading(false);
        return;
      }

      const pages = brandData.pages || [];
      const foundPage = pages.find((p: any) => p.slug === pageSlug);

      if (!foundPage) {
        console.error("Page not found:", pageSlug);
        setLoading(false);
        return;
      }

      setPage(foundPage);
      setLoading(false);
    }

    loadCityAndPage();
  }, [citySlug, pageSlug]);

  if (loading) {
    return <div className="p-6">Loading page…</div>;
  }

  if (!city) {
    return <div className="p-6 text-red-600">City not found.</div>;
  }

  if (!page) {
    return <div className="p-6 text-red-600">Page not found.</div>;
  }

  return (
    <div className="space-y-10 p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold">{page.title}</h1>

      {/* Render modules */}
      {page.modules?.map((mod, index) => {
        switch (mod.type) {
          case "stories":
            return (
              <StoryModuleEditor
                key={index}
                cityId={city.id}
                moduleConfig={mod}
              />
            );

          case "civic_places":
            return (
              <PlaceModuleEditor
                key={index}
                cityId={city.id}
                moduleConfig={mod}
              />
            );

          case "timeline":
            return (
              <MomentModuleEditor
                key={index}
                cityId={city.id}
                moduleConfig={mod}
              />
            );

          case "entities":
            return (
              <EntityModuleEditor
                key={index}
                cityId={city.id}
                moduleConfig={mod}
              />
            );

          case "civic_artifacts":
            return (
              <ArtifactModuleEditor
                key={index}
                cityId={city.id}
                moduleConfig={mod}
              />
            );

          case "neighborhoods":
            return (
              <NeighborhoodModuleEditor
                key={index}
                cityId={city.id}
                moduleConfig={mod}
              />
            );

          case "moments":
            return (
              <MomentModuleEditor
                key={index}
                cityId={city.id}
                moduleConfig={mod}
              />
            );

          case supabase.from("civic_eras"):
            return (
              <EraModuleEditor
                key={index}
                cityId={city.id}
                moduleConfig={mod}
              />
            );

          default:
            return (
              <div key={index} className="p-4 border rounded bg-yellow-50">
                Unknown module type: {mod.type}
              </div>
            );
        }
      })}
    </div>
  );
}
