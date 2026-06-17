import { adminTables } from "@/lib/admin/config";
import { TableModulePage } from "@/components/admin/TableModulePage";

export default async function GameScoresPage() {
  return <TableModulePage table={adminTables.game_scores.key} />;
}
