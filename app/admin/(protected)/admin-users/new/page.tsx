import { adminTables } from "@/lib/admin/config";
import { NewRecordPage } from "@/components/admin/NewRecordPage";

export default function NewAdminUserPage() {
  return <NewRecordPage table={adminTables.admin_users.key} />;
}
