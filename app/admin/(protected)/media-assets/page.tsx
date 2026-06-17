import { adminTables } from "@/lib/admin/config";
import { TableModulePage } from "@/components/admin/TableModulePage";

export default async function MediaAssetsPage() {
  return <TableModulePage table={adminTables.media_assets.key} />;
}
