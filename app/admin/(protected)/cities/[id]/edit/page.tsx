import { adminTables } from "@/lib/admin/config";
import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditCityPage({ params }: { params: { id: string } }) {
  return <EditRecordPage table={adminTables.cities.key} id={params.id} />;
}
