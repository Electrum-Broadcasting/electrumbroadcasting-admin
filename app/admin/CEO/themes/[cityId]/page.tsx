import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeForm } from "@/components/admin/themes/ThemeForm";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ThemeEditorPage({ params }: { params: { cityId: string } }) {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const [{ data: city, error }, { data: themeRow }] = await Promise.all([
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
  ]);

  if (error || !city) {
    return (
      <AdminShell email={email} role={role} title="Theme Not Found">
        <p className="text-slate-500 text-sm">City or theme not found.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell email={email} role={role} title={`${city.name} Theme`}>
      <ThemeForm
        city={city}
        draftTheme={themeRow?.draft_theme ?? null}
        publishedTheme={themeRow?.published_theme ?? null}
      />
    </AdminShell>
  );
}
