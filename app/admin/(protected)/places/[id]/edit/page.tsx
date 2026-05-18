import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditPlacePage({ params }: { params: { id: string } }) {
  return <EditRecordPage table="places" id={params.id} />;
}
