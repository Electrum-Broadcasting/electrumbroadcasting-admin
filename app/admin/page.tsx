import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/context";

export default async function AdminLandingPage() {
  const { role, city_ids } = await getAdminContext();

  switch (role) {
    case "CEO":
      redirect("/admin/CEO");

    case "PLATFORM_ADMIN":
      redirect("/admin/dashboard");

    case "CITY_ADMIN":
      if (city_ids.length > 0) {
        redirect(`/admin/city/${city_ids[0]}/pages`);
      }
      redirect("/login?error=No city assigned");

    case "EDITOR":
      redirect("/login?error=Editor access is not yet available");

    default:
      redirect("/login?error=Unauthorized");
  }
}
