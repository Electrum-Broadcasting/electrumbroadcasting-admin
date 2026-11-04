import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/context";

export default async function CityAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { cityId: string };
}) {
  const admin = await getAdminContext();

  const allowed =
    admin.role === "CEO" ||
    admin.role === "PLATFORM_ADMIN" ||
    (admin.role === "CITY_ADMIN" && admin.city_ids.includes(params.cityId));

  if (!allowed) {
    redirect("/login?error=Unauthorized");
  }

  return (
    <AdminShell
      email={admin.email}
      role={admin.role}
      title="City Administration"
      cityId={params.cityId}
    >
      {children}
    </AdminShell>
  );
}
