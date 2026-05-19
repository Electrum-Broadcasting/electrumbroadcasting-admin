import { redirect } from "next/navigation";
import type { AdminTableName } from "@/lib/admin/config";
import { listRows } from "@/lib/admin/data";
import { TableToolbar } from "@/components/admin/TableToolbar";
import { RecordsTable } from "@/components/admin/RecordsTable";
import { canCreate, canDelete, canEdit } from "@/lib/admin/permissions";
import { getCurrentRole, requireAuthenticatedUser } from "@/lib/admin/auth";
import { hasMinimumRole } from "@/lib/admin/role";

interface TableModulePageProps {
  table: AdminTableName;
}

export async function TableModulePage({ table }: TableModulePageProps) {
  const user = await requireAuthenticatedUser();
  const role = await getCurrentRole(user.id);

  if (!role || !hasMinimumRole(role, "admin")) {
    redirect("/");
  }

  const rows = await listRows(table);

  return (
    <div>
      <TableToolbar table={table} canCreate={canCreate(role)} />
      <RecordsTable table={table} rows={rows} canEdit={canEdit(role)} canDelete={canDelete(role)} />
    </div>
  );
}
