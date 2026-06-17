import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

async function getUser(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("email, role")
    .eq("user_id", id)
    .maybeSingle();

  if (error || !data) throw new Error("User not found");
  return data;
}

export default async function DeleteUserPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await getAdminContext();
  const user = await getUser(params.id);

  async function deleteUser() {
    "use server";

    const supabase = createSupabaseServiceClient();

    await supabase.from("admin_users").delete().eq("user_id", params.id);
    await supabase.auth.admin.deleteUser(params.id);

    redirect("/admin/CEO/users?toast=User%20deleted");
  }

  return (
    <AdminShell email={admin.email} role={admin.role} title="Delete User">
      <div className="max-w-lg space-y-6">
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this user?
        </p>

        <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
          <p className="text-sm font-medium text-ink">{user.email}</p>
          <p className="text-xs text-slate-500">{user.role}</p>
        </div>

        <form action={deleteUser} className="flex gap-3">
          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
          >
            Delete User
          </button>

          <a
            href="/admin/CEO/users"
            className="px-4 py-2 rounded-md border border-slate-300 text-sm text-ink hover:bg-slate-50"
          >
            Cancel
          </a>
        </form>
      </div>
    </AdminShell>
  );
}
