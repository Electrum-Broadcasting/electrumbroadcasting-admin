import { AdminShell } from "@/components/admin/AdminShell";
import { CityForm } from "@/components/admin/cities/CityForm";
import { getAdminContext } from "@/lib/admin/context";

export default async function CreateCityPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const { email, role } = await getAdminContext();

  return (
    <AdminShell email={email} role={role} title="Create City">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold text-ink mb-6">Create New City</h2>
        <CityForm mode="create" error={searchParams?.error ?? null} />
      </div>
    </AdminShell>
  );
}
