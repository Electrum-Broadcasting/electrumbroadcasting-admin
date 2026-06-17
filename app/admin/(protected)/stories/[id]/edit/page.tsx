import { adminTables } from "@/lib/admin/config";
import { EditRecordPage } from "@/components/admin/EditRecordPage";

export default async function EditStoryPage({ params }: { params: { id: string } }) {
  return <EditRecordPage table={adminTables.stories.key} id={params.id} />;
}
