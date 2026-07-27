"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MomentsAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [moments, setMoments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("civic_moments")
        .select("*")
        .eq("city_id", city.id)
        .order("moment_date", { ascending: true });

      setMoments(data || []);
      setLoading(false);
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Moments</h1>

      <Link
        href={`/${citySlug}/moments/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Moment
      </Link>

      <div className="mt-6 border rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Date</th>
              <th className="p-3">Category</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {moments.map((moment) => (
              <tr key={moment.id} className="border-t">
                <td className="p-3">{moment.title}</td>
                <td className="p-3">{moment.moment_date || moment.moment_year || "—"}</td>
                <td className="p-3">{moment.category || "—"}</td>
                <td className="p-3">{moment.is_published ? "Yes" : "No"}</td>
                <td className="p-3 space-x-3">
                  <Link
                    href={`/${citySlug}/moments/${moment.slug}`}
                    className="text-blue-600 underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/${citySlug}/moments/${moment.slug}/edit`}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {moments.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  No moments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
