"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  errorMessage,
  fetchCityPages,
  saveCityPages,
  type CityPage as Page,
} from "@/lib/admin/cityPagesClient";

interface CityPageListProps {
  params: {
    cityId: string;
  };
}

export default function CityPageList({ params }: CityPageListProps) {
  const cityId = params.cityId;
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPages() {
      try {
        setPages(await fetchCityPages(cityId));
      } catch (e) {
        setError(errorMessage(e));
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

      {error && (
        <div role="alert" className="border border-red-300 bg-red-50 text-red-700 rounded p-3">
          {error}
        </div>
      )}

      {pages.length === 0 && !error && (
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

                  try {
                    setPages(await saveCityPages(cityId, updatedPages));
                    setError(null);
                  } catch (e) {
                    setError(errorMessage(e));
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
