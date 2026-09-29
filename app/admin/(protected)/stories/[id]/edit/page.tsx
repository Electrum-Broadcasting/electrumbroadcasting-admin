// app/admin/(protected)/stories/[id]/edit/page.tsx

import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import AdminStoryToolbar from "@/components/admin/AdminStoryToolbar";
import EditStoryClientWrapper from "./EditStoryClientWrapper";

export default async function EditStoryPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: story } = await supabase
    .from("civic_stories")
    .select("*")
    .eq("id", params.id)
    .single();

  return (
    <AdminShell
      email={admin.email}
      role={admin.role}
      title={`Edit Story: ${story.title}`}
      cityName={admin.city_name}
    >
      <AdminStoryToolbar storyId={story.id} />
      <EditStoryClientWrapper story={story} admin={admin} />
    </AdminShell>
  );
}
