"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  errorMessage,
  fetchCityPages,
  saveCityPages,
} from "@/lib/admin/cityPagesClient";

export default function PageDelete({ params }: { params: { cityId: string; pageSlug: string } }) {
  const router = useRouter();

  const cityId = params.cityId;
  const pageSlug = params.pageSlug;

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      try {
        const pages = await fetchCityPages(cityId);
        const foundPage = pages.find((p) => p.slug === pageSlug);

        if (!foundPage) {
          setError(`Page "${pageSlug}" was not found.`);
          return;
        }

        setPage(foundPage);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [cityId, pageSlug]);

  async function deletePage() {
    setDeleting(true);
    setError(null);

    try {
      const pages = await fetchCityPages(cityId);
      const updatedPages = pages.filter((p) => p.slug !== pageSlug);
      await saveCityPages(cityId, updatedPages);
    } catch (e) {
      setError(errorMessage(e));
      setDeleting(false);
      return;
    }

    router.push(`/admin/city/${cityId}/pages`);
  }

  if (loading) {
    return <div className="p-6">Loading delete confirmation…</div>;
  }

  if (!page) {
    return (
      <div className="p-6">
        <div role="alert" className="border border-red-300 bg-red-50 text-red-700 rounded p-3">
          {error ?? "Page could not be loaded."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-red-700">
        Delete Page: {page.title}
      </h1>

      <div className="border rounded p-4 bg-red-50 space-y-4">
        <p className="text-gray-800">
          You are about to permanently delete this page:
        </p>

        <div className="border rounded p-3 bg-white">
          <div className="font-medium">{page.title}</div>
          <div className="text-sm text-gray-500">/{page.slug}</div>
          <div className="text-xs text-gray-400">
            {page.modules?.length || 0} modules
          </div>
        </div>

        <p className="text-red-700 font-medium">
          This action cannot be undone.
        </p>
      </div>

      {error && (
        <div role="alert" className="border border-red-300 bg-red-50 text-red-700 rounded p-3">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => router.push(`/admin/city/${cityId}/pages/${pageSlug}`)}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={deletePage}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete Page"}
        </button>
      </div>
    </div>
  );
}
