import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sortCitiesByIngestionPriority,
  type IngestionCity,
} from "./ingestionConfig.ts";
import { fetchOSMPlaces } from "./osmAdapter.ts";

type CitySummary = {
  city_id: string;
  city_name: string;
  fetched: number;
  ingested: number;
  failed: number;
  error?: string;
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const secret = Deno.env.get("OSM_PIPELINE_ADMIN_SECRET");
  if (!secret || req.headers.get("x-admin-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const summaries: CitySummary[] = [];

  const { data: cities, error: citiesError } = await supabase
    .from("cities")
    .select("id, name, slug, latitude, longitude");

  if (citiesError) {
    return new Response(JSON.stringify({ error: citiesError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const city of sortCitiesByIngestionPriority(
    (cities ?? []) as IngestionCity[],
  )) {
    const summary: CitySummary = {
      city_id: city.id,
      city_name: city.name,
      fetched: 0,
      ingested: 0,
      failed: 0,
    };

    try {
      const payloads = await fetchOSMPlaces(city);
      summary.fetched = payloads.length;

      for (const payload of payloads) {
        const { error } = await supabase.rpc("rpc_ingest_raw", {
          source_name: payload.source_name,
          source_object_id: payload.source_object_id,
          payload: payload.payload,
        });

        if (error) {
          summary.failed += 1;
          continue;
        }

        summary.ingested += 1;
      }
    } catch (error) {
      summary.error = error instanceof Error ? error.message : String(error);
      summary.failed += 1;
    }

    summaries.push(summary);
  }

  // TODO: Add ingestion_started and source-level event logging through log_admin_action.
  // TODO: Add retries and rate limiting for Overpass responses.
  return new Response(JSON.stringify({
    source: "openstreetmap",
    cities: summaries,
    totals: {
      fetched: summaries.reduce((total, summary) => total + summary.fetched, 0),
      ingested: summaries.reduce((total, summary) => total + summary.ingested, 0),
      failed: summaries.reduce((total, summary) => total + summary.failed, 0),
    },
  }), {
    headers: { "Content-Type": "application/json" },
  });
});