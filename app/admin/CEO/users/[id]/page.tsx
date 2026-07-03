import { AdminShell } from "@/components/admin/AdminShell";
import {
  UserForm,
  type AdminUserRow,
  type CityRow,
} from "@/components/admin/CEO/users/UserForm";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getUserById(id: string): Promise<AdminUserRow | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id, email, role, city_ids, status, primary_city_slug")
    .eq("user_id", id)
    .single();

  return (data as AdminUserRow) ?? null;
}

async function getCities(): Promise<CityRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug")
    .order("name");

  return (data as CityRow[]) ?? [];
}

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
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

  return (
    <AdminShell email={admin.email} role={admin.role} title="Edit User">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold text-ink mb-6">Edit User</h2>
        <UserForm mode="edit" user={user} cities={cities} />

        <div className="pt-4">
          <Link
            href={`/admin/CEO/users/${user.user_id}/delete`}
            className="text-red-600 hover:underline text-sm"
          >
            Delete User
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
