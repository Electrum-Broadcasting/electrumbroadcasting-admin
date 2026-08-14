import { AdminShell } from "@/components/admin/AdminShell";
import { CitiesTable } from "@/components/admin/cities/CitiesTable";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CitiesHeader } from "./CitiesHeader";

export default async function CEOCitiesPage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: cities, error } = await supabase
    .from("cities")
    .select("*")
    .order("name", { ascending: true });

  return (
    <AdminShell email={email} role={role} title="Cities">
      <CitiesHeader />
      <CitiesTable cities={cities ?? []} error={error ? error.message : null} />
    </AdminShell>
  );
}
