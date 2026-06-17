import { adminTables } from "@/lib/admin/config";
import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditGameScorePage({ params }: { params: { id: string } }) {
  return <EditRecordPage table={adminTables.game_scores.key} id={params.id} />;
}
