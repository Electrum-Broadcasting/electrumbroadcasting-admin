import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeStatusBadge } from "@/components/admin/themes/ThemeStatusBadge";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ThemesListPage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const [{ data: cities }, { data: themes }] = await Promise.all([
    supabase.from("cities").select("id, name, updated_at").order("name", { ascending: true }),
    supabase.from("city_themes").select("city_id, draft_theme, published_theme"),
  ]);

  const themeByCityId = new Map(
    (themes ?? []).map((theme) => [theme.city_id, theme])
  );

  return (
    <AdminShell email={email} role={role} title="Themes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">City Themes</h2>
        </div>

        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
          {cities?.length ? (
            cities.map((city) => {
              const theme = themeByCityId.get(city.id);

              return (
                <Link
                  key={city.id}
                  href={`/admin/CEO/themes/${city.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{city.name}</p>
                    <p className="text-xs text-slate-500">
                      Updated {new Date(city.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ThemeStatusBadge
                      draftTheme={theme?.draft_theme}
                      publishedTheme={theme?.published_theme}
                    />
                    <span className="text-slate-400 text-sm">Edit →</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="p-4 text-sm text-slate-500">
              No themes found. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
