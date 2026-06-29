import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ToastBoundary } from "@/components/ui/ToastBoundary";
import { ToastTrigger } from "@/components/ui/ToastTrigger";
import Link from "next/link";

// Types
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

async function getUserById(id: string): Promise<AdminUserRow | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id, email, role, city_ids, status")
    .eq("user_id", id)
    .single();

  return (data as AdminUserRow) ?? null;
}

async function getCities(): Promise<CityRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name")
    .order("name");

  return (data as CityRow[]) ?? [];
}

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { toast?: string };
}) {
  const admin = await getAdminContext();
  const user = await getUserById(params.id);
  const cities = await getCities();

  if (!user) {
    return (
      <AdminShell email={admin.email} role={admin.role} title="User Not Found">
        <p className="text-red-600">User not found.</p>
        <Link href="/admin/CEO/users" className="text-ink underline">
          Back to Users
        </Link>
      </AdminShell>
    );
  }

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
      <AdminShell email={admin.email} role={admin.role} title="Edit User">
        {searchParams.toast && (
          <ToastTrigger message={decodeURIComponent(searchParams.toast)} />
        )}

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-ink">
            Edit User: {user.email}
          </h1>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-600 uppercase mb-2">
              Email
            </h2>
            <p className="text-ink">{user.email}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-600 uppercase mb-2">
              Role
            </h2>
            <p className="text-ink">{user.role.replace("_", " ")}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-600 uppercase mb-2">
              Cities
            </h2>

            <div className="flex flex-wrap gap-1">
              {(user.city_ids ?? []).length === 0 && (
                <span className="text-xs text-slate-400 italic">None</span>
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
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-600 uppercase mb-2">
              Status
            </h2>
            {user.status === "active" ? (
              <span className="text-green-600 font-medium">Active</span>
            ) : (
              <span className="text-red-600 font-medium">Suspended</span>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <Link
              href={`/admin/CEO/users/${user.user_id}/delete`}
              className="text-red-600 hover:underline"
            >
              Delete User
            </Link>

            <Link
              href="/admin/CEO/users"
              className="text-ink hover:underline"
            >
              Back to Users
            </Link>
          </div>
        </div>
      </AdminShell>
    </ToastBoundary>
  );
}
