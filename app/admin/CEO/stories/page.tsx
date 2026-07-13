import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { CEOStoriesPanel } from "@/components/admin/CEO/stories/StoriesPanel";
import { getAdminContext } from "@/lib/admin/context";

export default async function CEOStoriesPage() {
  const admin = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: stories } = await supabase
    .from("civic_stories")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminShell email={admin.email} role={admin.role} title="Stories">
      <CEOStoriesPanel stories={stories ?? []} />
    </AdminShell>
  );
}
