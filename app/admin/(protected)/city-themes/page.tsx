import { adminTables } from "@/lib/admin/config";
import { TableModulePage } from "@/components/admin/TableModulePage";

export default async function CityThemesPage() {
  return <TableModulePage table={adminTables.city_design_system.key} />;
}
