import "server-only";

import { getAdminContextOrNull } from "@/lib/admin/context";
import { canAccessCity } from "@/lib/admin/permissions";
import { canReadSafety } from "@/lib/admin/storyModerationTypes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function resolveSafetyCity(slug: string) {
  const admin = await getAdminContextOrNull();
  if (!admin) return { error: "Unauthorized", status: 401 } as const;
  if (!canReadSafety(admin.role)) return { error: "Forbidden", status: 403 } as const;
  const supabase = createSupabaseServerClient();
  const { data: city, error } = await supabase.from("cities")
    .select("id, name, slug").eq("slug", slug).maybeSingle();
  if (error) {
    console.error("Failed to resolve safety city:", error);
    return { error: "Unable to load city", status: 500 } as const;
  }
  if (!city) return { error: "City not found", status: 404 } as const;
  if (!canAccessCity(admin, city.id)) return { error: "Forbidden", status: 403 } as const;
  return { admin, city } as const;
}
