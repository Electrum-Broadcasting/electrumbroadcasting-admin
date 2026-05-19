import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditGameScorePage({ params }: { params: { id: string } }) {
  return <EditRecordPage table="scores" id={params.id} />;
}
