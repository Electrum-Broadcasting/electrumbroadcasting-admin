import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/auth";

export default async function AdminLandingPage() {
  const { role, cityIds } = await getAdminContext();

  switch (role) {
    case "CEO":
      redirect("/admin/CEO");

    case "PLATFORM_ADMIN":
      redirect("/admin/platform");

    case "CITY_ADMIN":
      redirect(`/admin/city/${cityIds[0]}`);

    case "EDITOR":
      redirect("/admin/editor");

    default:
      redirect("/admin/unauthorized");
  }
}
