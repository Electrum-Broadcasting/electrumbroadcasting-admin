import { redirect } from "next/navigation";
import { CitySafetyDashboard } from "@/components/admin/city/CitySafetyDashboard";
import { resolveSafetyCity } from "@/lib/admin/safetyCity";

export default async function CitySafetyPage({ params }: { params: { id: string } }) {
  const context = await resolveSafetyCity(params.id);
  if ("error" in context) {
    if (context.status === 401) redirect("/login?error=Not authenticated");
    if (context.status === 403) redirect("/admin");
    throw new Error(context.error);
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Safety Dashboard — {context.city.name}</h1>
      <CitySafetyDashboard citySlug={context.city.slug} role={context.admin.role} />
    </div>
  );
}
