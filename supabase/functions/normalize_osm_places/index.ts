import { serve } from "https://deno.land/std/http/server.ts";

serve(() => new Response(
  "This normalization endpoint is retired. Use the governed OSM ingestion workflow.",
  { status: 410 },
));
