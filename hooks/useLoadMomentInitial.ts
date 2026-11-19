"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { loadMomentRelationships } from "@/lib/moments/relationshipClient";
import type { MomentRelationshipSnapshot } from "@/lib/moments/relationships";

export function useLoadMomentInitial(citySlug: string, momentSlug: string) {
  const [supabase] = useState(createBrowserClient);

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      console.log("Moment slug:", momentSlug);

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

      //
      // 2. Load moment
      //
      console.log(
        "Looking up moment with slug:",
        momentSlug,
        "and city_id:",
        city.id
      );

      const { data: moment } = await supabase
        .from("civic_moments")
        .select("*")
        .eq("slug", momentSlug)
        .eq("city_id", city.id)
        .single();

      console.log("Loaded moment:", moment);

      if (!moment) {
        setLoading(false);
        return;
      }

      let momentRelationships: MomentRelationshipSnapshot | null = null;
      let snapshotError: string | null = null;
      try {
        momentRelationships = await loadMomentRelationships(moment.id, city.id);
      } catch (error) {
        console.error("Failed to load complete Moment relationships:", error);
        snapshotError = error instanceof Error && error.message ? error.message : "Unable to load Moment relationships.";
      }

      //
      // 4. Load spatial metadata (THIS WAS MISSING)
      //
      const { data: places } = await supabase
        .from("civic_places")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: neighborhoods } = await supabase
        .from("civic_neighborhoods")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: erasTargets } = await supabase
        .from("civic_eras")
        .select("id, name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      //
      // 5. Load relationship targets
      //
      const { data: events } = await supabase
        .from("civic_events")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: entities } = await supabase
        .from("civic_entities")
        .select("id, name")
        .eq("city_id", city.id);

      const { data: artifacts } = await supabase
        .from("civic_artifacts")
        .select("id, title")
        .eq("city_id", city.id);

      const { data: stories } = await supabase
        .from("civic_stories")
        .select("id, title")
        .eq("city_id", city.id);

      //
      // 6. Unified relationships
      //
      const { data: relationships, error: relationshipsError } = await supabase
        .from("civic_relationships").select("*").eq("from_type", "moment").eq("from_id", moment.id);
      const graphError = relationshipsError || (relationships === null ? "Missing civic graph response" : null);
      const linksError = snapshotError || graphError;
      if (linksError) console.error("Failed to load Moment relationships:", linksError);

      //
      // 7. Return everything
      //
      setInitialData({
        cityId: city.id,
        moment,

        momentRelationships,

        // metadata
        places,
        neighborhoods,
        erasTargets,

        // relationship targets
        events,
        entities,
        artifacts,
        stories,

        // unified relationships
        relationships,
        relationshipsLoaded: momentRelationships !== null && !graphError,
        relationshipsError: snapshotError || (graphError ? "Unable to load civic graph relationships." : null),
      });

      setLoading(false);
    }

    load();
  }, [citySlug, momentSlug, supabase]);

  return { loading, initialData };
}
