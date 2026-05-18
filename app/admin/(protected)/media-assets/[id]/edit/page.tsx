import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditMediaAssetPage({ params }: { params: { id: string } }) {
  return <EditRecordPage table="media_assets" id={params.id} />;
}
