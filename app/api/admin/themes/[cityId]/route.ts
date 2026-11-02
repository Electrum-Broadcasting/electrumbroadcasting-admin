import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { validateTheme } from "@/lib/themes/validateTheme";

function isThemeObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function PATCH(
  req: Request,
  { params }: { params: { cityId: string } }
) {
  try {
    const admin = await getAdminContext();
    const cityId = params.cityId;
    const isCEO = admin.role === "CEO";
    const isPlatformAdmin = admin.role === "PLATFORM_ADMIN";
    const isCityAdmin =
      admin.role === "CITY_ADMIN" && admin.city_ids.includes(cityId);

    if (!isCEO && !isPlatformAdmin && !isCityAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid theme payload" }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const hasDraft = Object.prototype.hasOwnProperty.call(payload, "draft_theme");
    const hasPublished = Object.prototype.hasOwnProperty.call(payload, "published_theme");

    if (!hasDraft && !hasPublished) {
      return NextResponse.json({ error: "No theme fields provided" }, { status: 400 });
    }

    for (const field of ["draft_theme", "published_theme"] as const) {
      if (!Object.prototype.hasOwnProperty.call(payload, field) || payload[field] === null) {
        continue;
      }
      if (!isThemeObject(payload[field])) {
        return NextResponse.json({ error: "Themes must be JSON objects or null" }, { status: 400 });
      }
      const validationError = validateTheme(payload[field]);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    if (hasPublished && !isCEO && !isPlatformAdmin) {
      return NextResponse.json(
        { error: "Only CEO or Platform Admin can publish themes" },
        { status: 403 }
      );
    }

    const update: Record<string, unknown> = {
      city_id: cityId,
      updated_at: new Date().toISOString(),
      updated_by: admin.user_id,
    };
    if (hasDraft) update.draft_theme = payload.draft_theme;
    if (hasPublished) update.published_theme = payload.published_theme;

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("city_design_system")
      .upsert(update, { onConflict: "city_id" });

    if (error) {
      console.error("Failed to update theme:", error);
      return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Theme update failed:", error);
    return NextResponse.json(
      { error: "Failed to update theme" },
      { status: 500 }
    );
  }
}
