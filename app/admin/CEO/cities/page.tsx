import { AdminShell } from "@/components/admin/AdminShell";
import { CitiesTable } from "@/components/admin/cities/CitiesTable";
import { getAdminContext } from "@/lib/admin/getAdminContext";

export default async function CEOCitiesPage() {
  const { email, role } = await getAdminContext();

  return (
    <AdminShell email={email} role={role} title="Cities">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-ink">All Cities</h2>

        <a
          href="/admin/CEO/cities/new"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
        >
          Create New City
        </a>
      </div>

      <CitiesTable />
    </AdminShell>
  );
}
