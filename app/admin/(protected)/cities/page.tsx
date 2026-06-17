import { adminTables } from "@/lib/admin/config";
import { TableModulePage } from "@/components/admin/TableModulePage";

export default async function CitiesPage() {
  return <TableModulePage table={adminTables.cities.key} />;
}
