import { adminTables } from "@/lib/admin/config";
import { NewRecordPage } from "@/components/admin/NewRecordPage";

export default function NewGameScorePage() {
  return <NewRecordPage table={adminTables.game_scores.key} />;
}
