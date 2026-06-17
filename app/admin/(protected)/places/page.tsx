import { adminTables } from "@/lib/admin/config";
import { TableModulePage } from "@/components/admin/TableModulePage";

export default async function PlacesPage() {
  return <TableModulePage table={adminTables.places.key} />;
}
