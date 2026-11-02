import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeForm } from "@/components/admin/themes/ThemeForm";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ThemeEditorPage({ params }: { params: { cityId: string } }) {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const [{ data: city, error }, { data: themeRow }, { data: globalSettings, error: globalThemeError }] = await Promise.all([
    supabase
      .from("cities")
      .select("id, name")
      .eq("id", params.cityId)
      .single(),
    supabase
      .from("city_design_system")
      .select("city_id, draft_theme, published_theme")
      .eq("city_id", params.cityId)
      .maybeSingle(),
    supabase
      .from("global_brand_settings")
      .select("theme_json")
      .eq("status", "published")
      .maybeSingle(),
  ]);

  if (error || globalThemeError || !city) {
    console.error("Failed to load CEO theme editor:", error ?? globalThemeError);
    return (
      <AdminShell email={email} role={role} title="Theme Not Found">
        <p role="alert" className="text-sm text-destructive">
          {error || !city
            ? "City or theme not found."
            : "Global brand defaults could not be loaded."}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell email={email} role={role} title={`${city.name} Theme`}>
      <ThemeForm
        city={city}
        draftTheme={themeRow?.draft_theme ?? null}
        publishedTheme={themeRow?.published_theme ?? null}
        globalTheme={globalSettings?.theme_json ?? null}
      />
    </AdminShell>
  );
}
