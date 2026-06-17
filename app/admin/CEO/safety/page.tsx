import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getSafetySettings } from "@/lib/safety/getSafetySettings";
import { redirect } from "next/navigation";
import { SafetyTabs } from "@/components/admin/safety/SafetyTabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SafetyPage() {
  const admin = await getAdminContext();

  // CEO-only access
  if (!admin || admin.role !== "CEO") {
    redirect("/admin");
  }

  // Load flag thresholds from existing JSONB settings
  const settings = await getSafetySettings();

  // Load moderation rules from the real SQL table
  const supabase = createSupabaseServerClient();

  const { data: moderationRules, error } = await supabase
    .from("moderation_rules")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load moderation rules:", error);
  }

  return (
    <AdminShell email={admin.email} role={admin.role} title="Safety Settings">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-ink">Safety Settings</h1>

        <div className="w-full max-w-none">
          <SafetyTabs
            flagThresholds={settings.flag_thresholds}
            moderationRules={moderationRules ?? []}
          />
        </div>
      </div>
    </AdminShell>
  );
}
