import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditAdminUserPage({ params }: { params: { id: string } }) {
  return <EditRecordPage table="admin_users" id={params.id} />;
}
