"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  errorMessage,
  fetchCityPages,
  saveCityPages,
} from "@/lib/admin/cityPagesClient";

export default function ReorderModules({ params }: { params: { cityId: string; pageSlug: string } }) {
  const router = useRouter();

  const cityId = params.cityId;
  const pageSlug = params.pageSlug;

  const [page, setPage] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setModules(foundPage.modules || []);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [cityId, pageSlug]);

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...modules];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setModules(updated);
  }

  function moveDown(index: number) {
    if (index === modules.length - 1) return;
    const updated = [...modules];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setModules(updated);
  }

  async function saveOrder() {
    setSaving(true);
    setError(null);

    try {
      const pages = await fetchCityPages(cityId);

      if (!pages.some((p) => p.slug === pageSlug)) {
        setError(`Page "${pageSlug}" no longer exists.`);
        setSaving(false);
        return;
      }

      const updatedPages = pages.map((p) =>
        p.slug === pageSlug ? { ...p, modules } : p
      );

      await saveCityPages(cityId, updatedPages);
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
      return;
    }

    router.push(`/admin/city/${cityId}/pages/${pageSlug}`);
  }

  if (loading) {
    return <div className="p-6">Loading module order…</div>;
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
      <h1 className="text-2xl font-semibold">Reorder Modules</h1>

      <div className="space-y-4">
        {modules.map((mod, index) => (
          <div
            key={index}
            className="border rounded p-4 flex justify-between items-center bg-gray-50"
          >
            <div>
              <div className="font-medium">
                {mod.type.charAt(0).toUpperCase() + mod.type.slice(1)} Module
              </div>
              <div className="text-xs text-gray-500">
                Position: {index + 1}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => moveUp(index)}
              >
                ↑ Move Up
              </button>

              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => moveDown(index)}
              >
                ↓ Move Down
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" className="border border-red-300 bg-red-50 text-red-700 rounded p-3">
          {error}
        </div>
      )}

      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={saveOrder}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save Order"}
      </button>
    </div>
  );
}
