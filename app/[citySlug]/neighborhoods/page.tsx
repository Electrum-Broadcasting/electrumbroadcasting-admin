"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NeighborhoodAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
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
        .from("civic_neighborhoods")
        .select("*")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      setNeighborhoods(data || []);
      setLoading(false);
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Neighborhoods</h1>

      <Link
        href={`/${citySlug}/neighborhoods/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Neighborhood
      </Link>

      <div className="mt-6 border rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {neighborhoods.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="p-3">{n.name}</td>
                <td className="p-3">{n.is_published ? "Yes" : "No"}</td>
                <td className="p-3 space-x-3">
                  <Link
                    href={`/${citySlug}/neighborhoods/${n.slug}`}
                    className="text-blue-600 underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/${citySlug}/neighborhoods/${n.slug}/edit`}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {neighborhoods.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={3}>
                  No neighborhoods found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
