"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Page {
  slug: string;
  title: string;
  modules?: unknown[];
}

interface CityPageListProps {
  params: {
    cityId: string;
  };
}

export default function CityPageList({ params }: CityPageListProps) {
  const cityId = params.cityId;
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPages() {
      const { data, error } = await supabase
        .from("city_brand_settings")
        .select("pages")
        .eq("city_id", cityId)
        .single();

      if (error) {
        console.error("Error loading pages:", error);
      } else {
        setPages(data.pages || []);
      }

      setLoading(false);
    }

    loadPages();
  }, [cityId]);

  if (loading) {
    return <div className="p-6">Loading pages…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">City Pages</h1>

        <Link
          href={`/admin/city/${cityId}/pages/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Page
        </Link>
      </div>

      {pages.length === 0 && (
        <div className="text-gray-500">No pages created yet.</div>
      )}

      <div className="space-y-4">
        {pages.map((page) => (
          <div
            key={page.slug}
            className="border rounded p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{page.title}</div>
              <div className="text-sm text-gray-500">/{page.slug}</div>
              <div className="text-xs text-gray-400">
                {page.modules?.length || 0} modules
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/city/${cityId}/pages/${page.slug}`}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Edit
              </Link>

              <Link
                href={`/admin/city/${cityId}/pages/${page.slug}/reorder`}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Reorder
              </Link>

              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={async () => {
                  const updatedPages = pages.filter(
                    (p) => p.slug !== page.slug
                  );

                  const { error } = await supabase
                    .from("city_brand_settings")
                    .update({ pages: updatedPages })
                    .eq("city_id", cityId);

                  if (error) {
                    console.error("Error deleting page:", error);
                  } else {
                    setPages(updatedPages);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
