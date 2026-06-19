import { CitySafetyDashboard } from "@/components/admin/city/CitySafetyDashboard";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export default async function CitySafetyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServiceClient();

  // 1. Look up the city by slug
  const { data: city, error } = await supabase
    .from("cities")
    .select("id, name, slug")
    .eq("slug", params.id)
    .single();

  // 2. Handle missing city
  if (error || !city) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Safety Dashboard</h1>
        <p className="text-red-500">
          City not found for slug: <strong>{params.id}</strong>
        </p>
      </div>
    );
  }

  // 3. Render dashboard with the real UUID
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Safety Dashboard — {city.name}
      </h1>

      <CitySafetyDashboard cityId={city.id} />
    </div>
  );
}
