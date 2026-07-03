import { AdminShell } from "@/components/admin/AdminShell";
import { CityForm } from "@/components/admin/cities/CityForm";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CityRow = {
  id: string;
  name: string;
  slug: string | null;
  // add any other columns your CityForm expects
};

export default async function EditCityPage({ params }: { params: { id: string } }) {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: city, error } = await supabase
    .from("cities")
    .select(`
      id,
      name,
      slug,
      domain,
      status,
      incorporated_year,
      electrum_year,
      description,
      country,
      state_province,
      latitude,
      longitude,
      population
    `)
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
        <CityForm mode="edit" city={city} />
      </div>
    </AdminShell>
  );
}
