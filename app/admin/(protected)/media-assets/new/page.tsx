import { adminTables } from "@/lib/admin/config";
import { NewRecordPage } from "@/components/admin/NewRecordPage";

export default function NewMediaAssetPage() {
  return <NewRecordPage table={adminTables.media_assets.key} />;
}
