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

  let citySlug = "";
  if (story.city_id) {
    const { data: city } = await supabase
      .from("cities")
      .select("slug")
      .eq("id", story.city_id)
      .maybeSingle();
    citySlug = city?.slug ?? "";
  }
  if (!citySlug) citySlug = admin.primary_city_slug ?? "";
  if (!citySlug) {
    throw new Error(`Unable to resolve a city slug for story ${params.id}`);
  }

  return (
    <AdminShell
      email={admin.email}
      role={admin.role}
      title={`Edit Story: ${story.title}`}
    >
      <AdminStoryToolbar storyId={story.id} />
      <EditStoryClientWrapper story={story} citySlug={citySlug} />
    </AdminShell>
  );
}
