"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { loadUnifiedRelationships } from "@/lib/joinTables";

export function useLoadMomentInitial(citySlug: string, momentSlug: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

      //
      // 3. Load join tables
      //
      const { data: momentPlaces } = await supabase
        .from("moment_places")
        .select("place_id")
        .eq("moment_id", moment.id);

      const { data: momentNeighborhoods } = await supabase
        .from("moment_neighborhoods")
        .select("neighborhood_id")
        .eq("moment_id", moment.id);

      const { data: momentEras } = await supabase
        .from("moment_eras")
        .select("era_id")
        .eq("moment_id", moment.id);

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
      const relationships = await loadUnifiedRelationships(
        supabase,
        "moment",
        moment.id
      );

      //
      // 7. Return everything
      //
      setInitialData({
        cityId: city.id,
        moment,

        // join tables
        momentPlaces,
        momentNeighborhoods,
        momentEras,

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
      });

      setLoading(false);
    }

    load();
  }, [citySlug, momentSlug]);

  return { loading, initialData };
}
