"use client";

import { useEffect, useState } from "react";

interface PageConfig {
  slug: string;
  title: string;
  subtitle?: string;
  modules: { type: string; limit?: number }[];
}

export default function CityPagesEditor({ cityId }: { cityId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<PageConfig[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/settings/city-pages?cityId=${cityId}`);
      const data = await res.json();
      setPages(data);
      setLoading(false);
    }
    load();
  }, [cityId]);

  function updatePage(index: number, field: keyof PageConfig, value: any) {
    const updated = [...pages];
    updated[index] = { ...updated[index], [field]: value };
    setPages(updated);
  }

  function addPage() {
    setPages([
      ...pages,
      { slug: "", title: "", subtitle: "", modules: [] },
    ]);
  }

  function removePage(index: number) {
    setPages(pages.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/settings/city-pages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, pages }),
    });
    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">City Pages</h2>

      <button
        onClick={addPage}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Add Page
      </button>

      <div className="space-y-4">
        {pages.map((page, index) => (
          <div key={index} className="border p-4 rounded space-y-2">
            <label className="block">
              <span>Slug (URL path)</span>
              <input
                className="w-full border p-2"
                value={page.slug}
                onChange={(e) =>
                  updatePage(index, "slug", e.target.value)
                }
              />
            </label>

            <label className="block">
              <span>Title</span>
              <input
                className="w-full border p-2"
                value={page.title}
                onChange={(e) =>
                  updatePage(index, "title", e.target.value)
                }
              />
            </label>

            <label className="block">
              <span>Subtitle</span>
              <input
                className="w-full border p-2"
                value={page.subtitle || ""}
                onChange={(e) =>
                  updatePage(index, "subtitle", e.target.value)
                }
              />
            </label>

            <label className="block">
              <span>Modules (JSON)</span>
              <textarea
                className="w-full border p-2 font-mono text-sm"
                value={JSON.stringify(page.modules, null, 2)}
                onChange={(e) =>
                  updatePage(
                    index,
                    "modules",
                    JSON.parse(e.target.value || "[]")
                  )
                }
              />
            </label>

            <button
              onClick={() => removePage(index)}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Remove Page
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {saving ? "Saving…" : "Save Pages"}
      </button>
    </div>
  );
}
