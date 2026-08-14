import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminContext();

  if (admin.role !== "CEO" && admin.role !== "PLATFORM_ADMIN" && admin.role !== "CITY_ADMIN") {
    redirect("/login?error=Unauthorized");
  }

  return <>{children}</>;
}
