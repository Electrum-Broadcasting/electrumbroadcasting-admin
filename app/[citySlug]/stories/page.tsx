"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StoriesAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 1. Get city ID from slug
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      // 2. Load stories for this city
      const { data } = await supabase
        .from("civic_stories")
        .select("*")
        .eq("city_id", city.id)
        .order("title", { ascending: true });

      setStories(data || []);
      setLoading(false);
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Stories</h1>

      <Link
        href={`/${citySlug}/stories/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Story
      </Link>

      <div className="mt-6 border rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Year</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {stories.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.title}</td>
                <td className="p-3">{s.category || "—"}</td>
                <td className="p-3">{s.year || "—"}</td>
                <td className="p-3">{s.is_published ? "Yes" : "No"}</td>

                <td className="p-3 space-x-3">
                  <Link
                    href={`/${citySlug}/stories/${s.slug}`}
                    className="text-blue-600 underline"
                  >
                    View
                  </Link>

                  <Link
                    href={`/${citySlug}/stories/${s.slug}/edit`}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {stories.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  No stories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
