"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EraAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [eras, setEras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 1. Lookup city_id
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      // 2. Fetch eras
      const { data } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("city_id", city.id)
        .order("start_year", { ascending: true });

      setEras(data || []);
      setLoading(false);
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Eras</h1>

      <Link
        href={`/${citySlug}/eras/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Era
      </Link>

      <div className="mt-6 border rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Years</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {eras.map((era) => (
              <tr key={era.id} className="border-t">
                <td className="p-3">{era.name}</td>
                <td className="p-3">
                  {era.start_year || "—"} – {era.end_year || "—"}
                </td>
                <td className="p-3">{era.is_published ? "Yes" : "No"}</td>
                <td className="p-3 space-x-3">
                  <Link
                    href={`/${citySlug}/eras/${era.slug}`}
                    className="text-blue-600 underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/${citySlug}/eras/${era.slug}/edit`}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {eras.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>
                  No eras found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
