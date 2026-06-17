import { adminTables } from "@/lib/admin/config";
import { TableModulePage } from "@/components/admin/TableModulePage";

export default async function AdminUsersPage() {
  return <TableModulePage table={adminTables.admin_users.key} />;
}
