import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ToastTrigger } from "@/components/ui/ToastTrigger";
import { ToastBoundary } from "@/components/ui/ToastBoundary";
import { CeoUsersHeader } from "@/components/admin/CEO/users/CeoUsersHeader";

// Types for strict mode
type AdminUserRow = {
  user_id: string;
  email: string;
  role: string;
  city_ids: string[] | null;
  status: string;
};

type CityRow = {
  id: string;
  name: string;
};

async function getUsers(): Promise<AdminUserRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id, email, role, city_ids, status")
    .order("email");

  return (data as AdminUserRow[]) ?? [];
}

async function getCities(): Promise<CityRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name")
    .order("name");

  return (data as CityRow[]) ?? [];
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { toast?: string };
}) {
  const admin = await getAdminContext();
  const [users, cities] = await Promise.all([getUsers(), getCities()]);

  // Strictly typed city map
  const cityMap: Map<string, string> = new Map(
    cities.map((c: CityRow) => [c.id, c.name])
  );

  return (
    <ToastBoundary
      toast={
        searchParams.toast
          ? decodeURIComponent(searchParams.toast)
          : undefined
      }
    >
      <AdminShell email={admin.email} role={admin.role} title="Users">
        {searchParams.toast && (
          <ToastTrigger message={decodeURIComponent(searchParams.toast)} />
        )}

        <CeoUsersHeader />

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Cities
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user: AdminUserRow) => (
                <tr key={user.user_id}>
                  <td className="px-4 py-3 text-sm text-ink">
                    {user.email}
                  </td>

                  <td className="px-4 py-3 text-sm text-ink">
                    {user.role.replace("_", " ")}
                  </td>

                  <td className="px-4 py-3 text-sm text-ink">
                    <div className="flex flex-wrap gap-1">
                      {(user.city_ids ?? []).length === 0 && (
                        <span className="text-xs text-slate-400 italic">
                          None
                        </span>
                      )}

                      {(user.city_ids ?? []).map((id: string) => {
                        const name = cityMap.get(id);
                        return name ? (
                          <span
                            key={id}
                            className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-800"
                          >
                            {name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {user.status === "active" ? (
                      <span className="text-green-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Suspended
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-sm">
                    <Link
                      href={`/admin/CEO/users/${user.user_id}`}
                      className="text-ink hover:underline mr-4"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/admin/CEO/users/${user.user_id}/delete`}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </ToastBoundary>
  );
}
