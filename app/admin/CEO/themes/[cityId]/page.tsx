import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeForm } from "@/components/admin/themes/ThemeForm";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { loadMergedTheme } from "@/lib/themes/loadTheme";

export default async function ThemeEditorPage({ params }: { params: { cityId: string } }) {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServiceClient();

  // 1. Load the city FIRST
  const { data: city, error } = await supabase
    .from("cities")
    .select("id, name, theme, theme_status")
    .eq("id", params.cityId)
    .single();

  if (error || !city) {
    return (
      <AdminShell email={email} role={role} title="Theme Not Found">
        <p className="text-slate-500 text-sm">City or theme not found.</p>
      </AdminShell>
    );
  }

  // 2. THEN merge the theme
  const mergedTheme = loadMergedTheme(city.theme);

  return (
    <AdminShell email={email} role={role} title={`${city.name} Theme`}>
      <ThemeForm city={city} theme={mergedTheme} />
    </AdminShell>
  );
}
