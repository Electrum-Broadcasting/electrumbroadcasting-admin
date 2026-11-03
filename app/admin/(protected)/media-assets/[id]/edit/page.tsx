import { adminTables } from "@/lib/admin/config";
import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditMediaAssetPage({ params }: { params: { id: string } }) {
  return <EditRecordPage table={adminTables.media_assets.key} id={params.id} />;
}
