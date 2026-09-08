import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findDuplicatePlace } from "./dedupe.ts";
import { normalizeOSMPlace } from "./normalizationRules.ts";
import type { OSMIngestionPayload } from "../ingest_osm_places/osmAdapter.ts";

type RawIngestionRow = {
  id: string;
  source_name: string;
  source_object_id: string;
  payload: OSMIngestionPayload["payload"];
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
  const { data: rawRows, error: rawRowsError } = await supabase
    .from("raw_ingestion")
    .select("id, source_name, source_object_id, payload")
    .eq("processed", false)
    .eq("source_name", "openstreetmap")
    .limit(500);

  if (rawRowsError) {
    return new Response(JSON.stringify({ error: rawRowsError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const summary = {
    source: "openstreetmap",
    loaded: rawRows?.length ?? 0,
    normalized: 0,
    duplicates: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const rawRow of (rawRows ?? []) as RawIngestionRow[]) {
    try {
      const ingestion: OSMIngestionPayload = {
        city_id: rawRow.payload.city_id,
        source_name: "openstreetmap",
        source_object_id: rawRow.source_object_id,
        payload: rawRow.payload,
      };
      const place = normalizeOSMPlace(ingestion);
      const duplicate = await findDuplicatePlace(supabase, {
        city_id: place.city_id,
        slug: place.slug,
        latitude: place.latitude,
        longitude: place.longitude,
        osm_id: ingestion.payload.osm_id,
      });

      if (duplicate.isDuplicate) {
        const { error: markDuplicateError } = await supabase.rpc(
          "rpc_mark_ingestion_processed",
          { raw_id: rawRow.id },
        );
        if (markDuplicateError) {
          throw new Error(markDuplicateError.message);
        }

        summary.duplicates += 1;
        continue;
      }

      const { error: insertError } = await supabase
        .from("civic_places")
        .insert(place);
      if (insertError) {
        throw new Error(insertError.message);
      }

      const { error: markError } = await supabase.rpc(
        "rpc_mark_ingestion_processed",
        { raw_id: rawRow.id },
      );
      if (markError) {
        throw new Error(markError.message);
      }

      summary.normalized += 1;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push(`${rawRow.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // TODO: Log ingestion_normalized and duplicate events through log_admin_action.
  // TODO: Implement suggestion generation in a later pipeline stage.
  // TODO: Implement relationship inference in a later pipeline stage.
  // TODO: Implement neighborhood inference in a later pipeline stage.
  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});