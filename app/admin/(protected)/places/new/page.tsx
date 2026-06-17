import { adminTables } from "@/lib/admin/config";
import { NewRecordPage } from "@/components/admin/NewRecordPage";

export default function NewPlacePage() {
  return <NewRecordPage table={adminTables.places.key} />;
}
