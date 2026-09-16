import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { CEOStoriesPanel } from "@/components/admin/CEO/stories/StoriesPanel";
import { getAdminContext } from "@/lib/admin/context";

export default async function CEOStoriesPage() {
  const admin = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: stories } = await supabase
  .from("civic_stories")
  .select(`
    id,
    title,
    body,
    summary,
    author_name,
    published_at,
    city_id,
    created_at,
    updated_at,
    slug,
    category,
    city,
    year,
    tags,
    image_description,
    related_place_ids,
    related_entity_ids,
    related_moment_ids,
    date_range,
    neighborhood,
    cross_city_links,
    entities,
    is_published,
    is_frozen,
    contributor_id
  `)
  .order("created_at", { ascending: false });

  return (
    <AdminShell email={admin.email} role={admin.role} title="Stories">
      <CEOStoriesPanel stories={stories ?? []} />
    </AdminShell>
  );
}
