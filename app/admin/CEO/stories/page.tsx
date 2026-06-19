import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { CEOStoriesPanel } from "@/components/admin/CEO/stories/StoriesPanel";

import type { StoryRow } from "@/lib/admin/types";

export default async function CEOStoriesPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const email = session.user.email ?? null;
  const jwtRole = session.user.app_metadata.role ?? "unknown";

  // Load all stories across all cities
  const { data } = await supabase
    .from("civic_stories")
    .select("*")
    .order("created_at", { ascending: false });

  const stories: StoryRow[] = (data ?? []) as StoryRow[];

  const selectedStoryId = stories.length > 0 ? stories[0].id : "";

  async function handleAction(storyId: string, action: string) {
    await supabase.rpc("admin_update_story_status", {
      story_id: storyId,
      action,
      metadata: {},
    });
  }

  return (
    <AdminShell email={email} role={jwtRole} title="Stories">
      <CEOStoriesPanel
        stories={stories}
        selectedStoryId={selectedStoryId}
        onSelectStory={() => {}}
        onHide={() => handleAction(selectedStoryId, "hide")}
        onRepublish={() => handleAction(selectedStoryId, "republish")}
        onFreeze={() => handleAction(selectedStoryId, "freeze")}
        onUnfreeze={() => handleAction(selectedStoryId, "unfreeze")}
      />
    </AdminShell>
  );
}
