"use client";

import { useEffect, useState } from "react";

export default function CityProfileEditor({ cityId }: { cityId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    description: "",
    summary: "",
    population: 0,
    editorial_tone: "",
    future_concepts: [],
    theme: {},
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/admin/settings/city-profile?cityId=${cityId}`
      );
      const data = await res.json();
      setForm({
        description: data.description || "",
        summary: data.summary || "",
        population: data.population || 0,
        editorial_tone: data.editorial_tone || "",
        future_concepts: data.future_concepts || [],
        theme: data.theme || {},
      });
      setLoading(false);
    }
    load();
  }, [cityId]);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/settings/city-profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, ...form }),
    });
    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">City Profile</h2>

      <div className="space-y-4">
        <label className="block">
          <span>Description</span>
          <textarea
            className="w-full border p-2"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
        </label>

        <label className="block">
          <span>Summary</span>
          <textarea
            className="w-full border p-2"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </label>

        <label className="block">
          <span>Population</span>
          <input
            type="number"
            className="w-full border p-2"
            value={form.population}
            onChange={(e) =>
              setForm({ ...form, population: e.target.value ? Number(e.target.value) : 0 })
            }
          />
        </label>

        <label className="block">
          <span>Editorial Tone</span>
          <input
            type="text"
            className="w-full border p-2"
            value={form.editorial_tone}
            onChange={(e) =>
              setForm({ ...form, editorial_tone: e.target.value })
            }
          />
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
