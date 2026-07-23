import { adminTables } from "@/lib/admin/config";
import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditCityThemePage({ params }: { params: { id: string } }) {
  return <EditRecordPage table={adminTables.city_design_system.key} id={params.id} />;
}
