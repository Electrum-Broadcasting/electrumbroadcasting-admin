import { adminTables } from "@/lib/admin/config";
import { NewRecordPage } from "@/components/admin/NewRecordPage";

export default function NewStoryPage() {
  return <NewRecordPage table={adminTables.stories.key} />;
}
