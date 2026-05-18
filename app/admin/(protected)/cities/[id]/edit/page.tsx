import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditCityPage({ params }: { params: { id: string } }) {
  return <EditRecordPage table="cities" id={params.id} />;
}
