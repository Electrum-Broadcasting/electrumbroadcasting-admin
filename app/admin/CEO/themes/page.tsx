import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ThemesListPage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: themes } = await supabase
    .from("cities")
    .select("id, city_id, name, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <AdminShell email={email} role={role} title="Themes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">City Themes</h2>
          <Link
            href="/admin/CEO/themes/new"
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            New Theme
          </Link>
        </div>

        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
          {themes?.length ? (
            themes.map((theme) => (
              <Link
                key={theme.id}
                href={`/admin/CEO/themes/${theme.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{theme.name}</p>
                  <p className="text-xs text-slate-500">
                    Updated {new Date(theme.updated_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-slate-400 text-sm">Edit →</span>
              </Link>
            ))
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
