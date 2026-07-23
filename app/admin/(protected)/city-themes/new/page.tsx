import { adminTables } from "@/lib/admin/config";
import { NewRecordPage } from "@/components/admin/NewRecordPage";

export default function NewCityThemePage() {
  return <NewRecordPage table={adminTables.city_design_system.key} />;
}
