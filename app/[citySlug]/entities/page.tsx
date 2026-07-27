"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EntityAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // 1. Lookup city_id
        const { data: city } = await supabase
          .from("cities")
          .select("id")
          .eq("slug", citySlug)
          .single();

        if (!city) {
          console.error("City not found");
          setLoading(false);
          return;
        }

        // 2. Fetch entities for this city
        const { data } = await supabase
          .from("civic_entities")
          .select("*")
          .eq("city_id", city.id)
          .order("name", { ascending: true });

        setEntities(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading entities:", error);
        setLoading(false);
      }
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Entities</h1>

      <Link
        href={`/${citySlug}/entities/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Entity
      </Link>

      <div className="mt-6 border rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Birth–Death</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {entities.map((entity) => (
              <tr key={entity.id} className="border-t">
                <td className="p-3">{entity.name}</td>
                <td className="p-3">{entity.entity_type || "—"}</td>
                <td className="p-3">
                  {entity.birth_year || "—"} – {entity.death_year || "—"}
                </td>
                <td className="p-3">
                  {entity.is_published ? "Yes" : "No"}
                </td>
                <td className="p-3 space-x-3">
                  <Link
                    href={`/${citySlug}/entities/${entity.slug}`}
                    className="text-blue-600 underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/${citySlug}/entities/${entity.slug}/edit`}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {entities.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  No entities found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
