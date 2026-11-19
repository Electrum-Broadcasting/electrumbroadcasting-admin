import { serve } from "https://deno.land/std/http/server.ts";

serve(() => new Response(
  "This ingestion endpoint is retired. Use the authenticated admin OSM run API.",
  { status: 410 },
));
