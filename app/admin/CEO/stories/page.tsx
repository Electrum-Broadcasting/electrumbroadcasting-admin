import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { CEOStoriesPanel } from "@/components/admin/CEO/stories/StoriesPanel";

export default async function CEOStoriesPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const email = session.user.email ?? null;
  const jwtRole = session.user.app_metadata.role ?? "unknown";

  const { data: stories } = await supabase
    .from("civic_stories")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminShell email={email} role={jwtRole} title="Stories">
      <CEOStoriesPanel stories={stories ?? []} />
    </AdminShell>
  );
}
