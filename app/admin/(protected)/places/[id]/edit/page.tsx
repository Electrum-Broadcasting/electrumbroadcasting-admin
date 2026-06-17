import { adminTables } from "@/lib/admin/config";
import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditPlacePage({ params }: { params: { id: string } }) {
  return <EditRecordPage table={adminTables.places.key} id={params.id} />;
}
