import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

async function getCities() {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, domain")
    .order("name");
  return data ?? [];
}

async function getUser(id: string) {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("admin_users")
    .select("email, role, city_ids, status")
    .eq("user_id", id)
    .maybeSingle();
  return data;
}

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await getAdminContext();
  const [cities, user] = await Promise.all([
    getCities(),
    getUser(params.id),
  ]);

  if (!user) {
    redirect("/admin/CEO/users?toast=User%20not%20found");
  }

  async function updateUser(formData: FormData) {
    "use server";

    const supabase = createSupabaseServiceClient();

    const role = formData.get("role") as string;
    const status = formData.get("status") as string;
    const cityIds = formData.getAll("cityIds") as string[];

    await supabase
      .from("admin_users")
      .update({ role, status, city_ids: cityIds })
      .eq("user_id", params.id);

    redirect("/admin/CEO/users?toast=User%20updated");
  }

  async function toggleSuspend() {
    "use server";

    const supabase = createSupabaseServiceClient();
    const newStatus = user.status === "active" ? "inactive" : "active";

    await supabase
      .from("admin_users")
      .update({ status: newStatus })
      .eq("user_id", params.id);

    redirect(
      `/admin/CEO/users?toast=User%20${
        newStatus === "active" ? "reinstated" : "suspended"
      }`
    );
  }

  async function sendReset() {
    "use server";

    const supabase = createSupabaseServiceClient();
    await supabase.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
    });

    redirect("/admin/CEO/users?toast=Password%20reset%20sent");
  }

  const userCityIds = new Set(user.city_ids ?? []);

  return (
    <AdminShell email={admin.email} role={admin.role} title="Edit User">
      <div className="max-w-xl space-y-6">
        <p className="text-sm text-slate-600">{user.email}</p>

        <form action={updateUser} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              defaultValue={user.role}
              className="w-full border border-slate-300 rounded-md px-3 py-2"
            >
              <option value="CITY_ADMIN">City Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="CEO">CEO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              defaultValue={user.status}
              className="w-full border border-slate-300 rounded-md px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Cities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cities.map((city) => (
                <label key={city.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="cityIds"
                    value={city.id}
                    defaultChecked={userCityIds.has(city.id)}
                    className="h-4 w-4"
                  />
                  {city.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-ink text-white px-4 py-2 rounded-md text-sm hover:bg-ink/90"
            >
              Save Changes
            </button>

            <a
              href="/admin/CEO/users"
              className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50"
            >
              Cancel
            </a>
          </div>
        </form>

        <form action={toggleSuspend}>
          <button
            type="submit"
            className="mt-4 px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50"
          >
            {user.status === "active" ? "Suspend User" : "Reinstate User"}
          </button>
        </form>

        <form action={sendReset}>
          <button
            type="submit"
            className="mt-4 px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50"
          >
            Send Password Reset Link
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
