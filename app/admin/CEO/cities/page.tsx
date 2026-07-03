import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CitiesTable  } from "@/components/admin/cities/CitiesTable";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CitiesHeader } from "./CitiesHeader";


export default async function CEOCitiesPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const email = session.user.email ?? null;

  // Load canonical admin role (uppercase) from admin_users
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", session.user.id)
    .single();

  const role = adminUser?.role ?? "UNKNOWN";

  return (
    <AdminShell email={email} role={role} title="Cities">
  <CitiesHeader />
  <CitiesTable />
</AdminShell>

  );
}
