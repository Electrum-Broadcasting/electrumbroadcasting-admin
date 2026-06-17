import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { ToastTrigger } from "@/components/ui/ToastTrigger";
import { ToastBoundary } from "@/components/ui/ToastBoundary";

async function getUsers() {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id, email, role, city_ids, status")
    .order("email");
  return data ?? [];
}

async function getCities() {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name")
    .order("name");
  return data ?? [];
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { toast?: string };
}) {
  const admin = await getAdminContext();
  const [users, cities] = await Promise.all([getUsers(), getCities()]);

  const cityMap = new Map(cities.map((c) => [c.id, c.name]));

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

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-ink">Users</h1>
          <Link
            href="/admin/CEO/users/new"
            className="bg-ink text-white px-4 py-2 rounded-md text-sm hover:bg-ink/90"
          >
            Create New User
          </Link>
        </div>

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
              {users.map((user) => (
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
