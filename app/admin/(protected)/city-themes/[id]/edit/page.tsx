import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditCityThemePage({ params }: { params: { id: string } }) {
  return <EditRecordPage table="themes" id={params.id} />;
}
