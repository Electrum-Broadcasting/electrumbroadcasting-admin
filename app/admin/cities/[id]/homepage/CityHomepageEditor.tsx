"use client";

import { useEffect, useState } from "react";

interface Theme {
  hero_title?: string;
  hero_subtitle?: string;
  [key: string]: any;
}

interface Form {
  theme: Theme;
  homepage_modules: any[];
}

export default function CityHomepageEditor({ cityId }: { cityId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Form>({
    theme: {},
    homepage_modules: [],
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/admin/settings/city-homepage?cityId=${cityId}`
      );
      const data = await res.json();
      setForm({
        theme: data.theme || {},
        homepage_modules: data.homepage_modules || [],
      });
      setLoading(false);
    }
    load();
  }, [cityId]);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/settings/city-homepage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, ...form }),
    });
    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">City Homepage</h2>

      <div className="space-y-4">
        <label className="block">
          <span>Hero Title</span>
          <input
            className="w-full border p-2"
            value={form.theme.hero_title || ""}
            onChange={(e) =>
              setForm({
                ...form,
                theme: { ...form.theme, hero_title: e.target.value },
              })
            }
          />
        </label>

        <label className="block">
          <span>Hero Subtitle</span>
          <input
            className="w-full border p-2"
            value={form.theme.hero_subtitle || ""}
            onChange={(e) =>
              setForm({
                ...form,
                theme: { ...form.theme, hero_subtitle: e.target.value },
              })
            }
          />
        </label>

        <label className="block">
          <span>Featured Modules (JSON)</span>
          <textarea
            className="w-full border p-2"
            value={JSON.stringify(form.homepage_modules, null, 2)}
            onChange={(e) =>
              setForm({
                ...form,
                homepage_modules: JSON.parse(e.target.value || "[]"),
              })
            }
          />
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {saving ? "Saving…" : "Save Homepage"}
        </button>
      </div>
    </div>
  );
}
