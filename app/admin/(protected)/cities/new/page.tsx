import { adminTables } from "@/lib/admin/config";
import { NewRecordPage } from "@/components/admin/NewRecordPage";

export default function NewCityPage() {
  return <NewRecordPage table={adminTables.cities.key} />;
}
