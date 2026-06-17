import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";

export default async function AdminLandingPage() {
  const { role, cityIds } = await getAdminContext();

  switch (role) {
  case "CEO":
  
    redirect("/admin/CEO");

  case "CITY_ADMIN":
    redirect(`/admin/city/${cityIds}`);

  case "EDITOR":
    redirect("/admin/editor");

  case "PLATFORM_ADMIN":
    redirect("/admin/platform");

  default:
    redirect("/login?error=unauthorized");
}

}
