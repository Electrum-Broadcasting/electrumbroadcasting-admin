import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/context";
import { IngestionOperations } from "@/components/admin/ingestion/IngestionOperations";

export default async function IngestionPage() {
  const admin = await getAdminContext();
  if (!["CEO", "PLATFORM_ADMIN", "CITY_ADMIN"].includes(admin.role)) redirect("/admin");
  return <IngestionOperations role={admin.role} />;
}