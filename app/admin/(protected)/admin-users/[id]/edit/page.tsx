import { adminTables } from "@/lib/admin/config";
import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditAdminUserPage({ params }: { params: { id: string } }) {
  return <EditRecordPage table={adminTables.admin_users.key} id={params.id} />;
}
