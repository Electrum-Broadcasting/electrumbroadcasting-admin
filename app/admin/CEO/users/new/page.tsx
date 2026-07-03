import { AdminShell } from "@/components/admin/AdminShell";
import {
  UserForm,
  type CityRow,
} from "@/components/admin/CEO/users/UserForm";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getCities(): Promise<CityRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug")
    .order("name");

  return (data as CityRow[]) ?? [];
}

export default async function NewUserPage() {
  const admin = await getAdminContext();
  const cities = await getCities();

  return (
    <AdminShell email={admin.email} role={admin.role} title="Create User">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold text-ink mb-6">Create New User</h2>
        <UserForm mode="create" cities={cities} />
      </div>
    </AdminShell>
  );
}
