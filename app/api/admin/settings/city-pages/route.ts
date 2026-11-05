import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiRequireCityAccess, isValidCityId } from "@/lib/admin/guards";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Structural validation only: unknown module types and extra fields are preserved.
function validatePages(pages: unknown): string | null {
  if (!Array.isArray(pages)) return "pages must be an array";

  const slugs = new Set<string>();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const label = `pages[${i}]`;

    if (!isRecord(page)) return `${label} must be an object`;
    if (typeof page.slug !== "string" || page.slug.trim() === "") {
      return `${label}.slug must be a non-empty string`;
    }
    if (typeof page.title !== "string") return `${label}.title must be a string`;
    if (!Array.isArray(page.modules)) return `${label}.modules must be an array`;

    if (slugs.has(page.slug)) return `Duplicate page slug: ${page.slug}`;
    slugs.add(page.slug);

    for (let j = 0; j < page.modules.length; j++) {
      const mod = page.modules[j];
      const modLabel = `${label}.modules[${j}]`;
      if (!isRecord(mod)) return `${modLabel} must be an object`;
      if (typeof mod.type !== "string" || mod.type.trim() === "") {
        return `${modLabel}.type must be a non-empty string`;
      }
    }
  }

  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");
  if (!isValidCityId(cityId)) {
    return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
  }
  const guard = await apiRequireCityAccess(cityId);
  if (guard.response) return guard.response;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("city_brand_settings")
    .select("pages")
    .eq("city_id", cityId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load city pages:", error);
    return NextResponse.json({ error: "Failed to load pages" }, { status: 500 });
  }

  return NextResponse.json({ pages: data?.pages ?? [] });
}

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { cityId, pages } = isRecord(body) ? body : ({} as Record<string, unknown>);
  if (!isValidCityId(cityId)) {
    return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
  }
  const guard = await apiRequireCityAccess(cityId);
  if (guard.response) return guard.response;

  const validationError = validatePages(pages);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("city_brand_settings")
    .upsert(
      { city_id: cityId, pages, updated_at: new Date().toISOString() },
      { onConflict: "city_id" }
    )
    .select("pages")
    .maybeSingle();

  if (error) {
    console.error("Failed to save city pages:", error);
    return NextResponse.json({ error: "Failed to save pages" }, { status: 500 });
  }
  if (!data) {
    console.error("City pages upsert returned no row for city", cityId);
    return NextResponse.json({ error: "Pages were not saved" }, { status: 500 });
  }

  return NextResponse.json({ success: true, pages: data.pages ?? [] });
}
