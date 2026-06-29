import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getCities() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, domain")
    .order("name");
  return data ?? [];
}

export default async function NewUserPage() {
  const admin = await getAdminContext();
  const cities = await getCities();

  async function createUser(formData: FormData) {
    "use server";

    const supabase = createSupabaseServerClient();

    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const cityIds = formData.getAll("cityIds") as string[];

    // 1. Create auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role, city_ids: cityIds },
      });

    if (authError || !authUser?.user) {
      redirect("/admin/CEO/users?toast=Failed%20to%20create%20user");
    }

    // 2. Insert into admin_users
    await supabase.from("admin_users").insert({
      user_id: authUser.user.id,
      email,
      role,
      city_ids: cityIds,
      status: "active",
    });

    // 3. Send password reset link
    await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    redirect("/admin/CEO/users?toast=User%20created");
  }

  return (
    <AdminShell email={admin.email} role={admin.role} title="Create User">
      <form action={createUser} className="space-y-6 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full border border-slate-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            name="role"
            required
            className="w-full border border-slate-300 rounded-md px-3 py-2"
          >
            <option value="CITY_ADMIN">City Admin</option>
            <option value="EDITOR">Editor</option>
            <option value="PLATFORM_ADMIN">Platform Admin</option>
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
            Create User
          </button>

          <a
            href="/admin/CEO/users"
            className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </AdminShell>
  );
}
