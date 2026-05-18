import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditCityThemePage({ params }: { params: { id: string } }) {
  return <EditRecordPage table="city_themes" id={params.id} />;
}
