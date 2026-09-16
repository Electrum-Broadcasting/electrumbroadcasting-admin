import { AdminShell } from "@/components/admin/AdminShell";
import { CityForm } from "@/components/admin/cities/CityForm";
import type { CityFormValue } from "@/components/admin/cities/CityForm/CityFormTypes";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditCityPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: city, error } = await supabase
    .from("cities")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !city) {
    return (
      <AdminShell email={email} role={role} title="City Not Found">
        <p className="text-slate-500 text-sm">City not found.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell email={email} role={role} title={`Edit ${city.name}`}>
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold text-ink mb-6">Edit City</h2>
        <CityForm mode="edit" city={city as CityFormValue} error={searchParams?.error ?? null} />
      </div>
    </AdminShell>
  );
}
