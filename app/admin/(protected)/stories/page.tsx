import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin/context";

export default async function StoriesPage() {
  const admin = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: stories } = await supabase
    .from("civic_stories")
    .select("id, title, slug, is_published, created_at")
    .eq("city_id", admin.city_id)
    .order("created_at", { ascending: false });

  return (
    <AdminShell
      email={admin.email}
      role={admin.role}
      title="Stories"
      cityName={admin.city_name}
    >
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Stories</h2>
        <Link
          href="/admin/stories/new"
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Create Story
        </Link>
      </div>

      <ul className="space-y-3">
        {stories?.map((story: { id: string; title: string; is_published: boolean }) => (
          <li key={story.id} className="border p-3 rounded bg-white">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{story.title}</p>
                <p className="text-sm text-slate-500">
                  {story.is_published ? "Published" : "Draft"}
                </p>
              </div>
              <Link
                href={`/admin/stories/${story.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
