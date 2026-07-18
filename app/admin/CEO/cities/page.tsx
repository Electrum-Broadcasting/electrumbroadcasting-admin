import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CitiesTable } from "@/components/admin/cities/CitiesTable";
import { CitiesHeader } from "./CitiesHeader";
import { redirect } from "next/navigation";

export default async function CEOCitiesPage() {
  const supabase = createSupabaseServerClient();

  // ⭐ Secure authenticated session check
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return redirect("/login?error=Session expired");
  }

  const user = authData.user;
  const email = user.email ?? null;

  // Load canonical admin role (uppercase) from admin_users
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("auth_uid", user.id)
    .single();

  const role = adminUser?.role ?? "UNKNOWN";

  return (
    <AdminShell email={email} role={role} title="Cities">
      <CitiesHeader />
      <CitiesTable />
    </AdminShell>
  );
}
