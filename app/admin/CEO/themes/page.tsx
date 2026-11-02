import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeStatusBadge } from "@/components/admin/themes/ThemeStatusBadge";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ThemesListPage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const [{ data: cities, error: cityError }, { data: themes, error: themeError }] = await Promise.all([
    supabase.from("cities").select("id, name, updated_at").order("name", { ascending: true }),
    supabase.from("city_design_system").select("city_id, draft_theme, published_theme"),
  ]);

  const themeByCityId = new Map(
    (themes ?? []).map((theme) => [theme.city_id, theme])
  );
  const loadError = cityError ?? themeError;

  return (
    <AdminShell email={email} role={role} title="Themes">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">City themes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare and publish each city’s design system.
          </p>
        </div>

        {loadError ? (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            City themes could not be loaded.
          </div>
        ) : null}

        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {!loadError && cities?.length ? (
            cities.map((city) => {
              const theme = themeByCityId.get(city.id);

              return (
                <Link
                  key={city.id}
                  href={`/admin/CEO/themes/${city.id}`}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{city.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {new Date(city.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ThemeStatusBadge
                      draftTheme={theme?.draft_theme}
                      publishedTheme={theme?.published_theme}
                    />
                    <span className="text-sm text-primary">Edit theme →</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              {loadError ? "Unable to display city themes." : "No cities found."}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
