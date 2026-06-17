import { AdminShell } from "@/components/admin/AdminShell";
import { CityForm } from "@/components/admin/cities/CityForm";
import { getAdminContext } from "@/lib/admin/getAdminContext";

export default async function CreateCityPage() {
  const { email, role } = await getAdminContext();

  return (
    <AdminShell email={email} role={role} title="Create City">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold text-ink mb-6">Create New City</h2>
        <CityForm mode="create" />
      </div>
    </AdminShell>
  );
}
