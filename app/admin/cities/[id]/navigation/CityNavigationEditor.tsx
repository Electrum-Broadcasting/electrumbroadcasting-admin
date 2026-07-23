"use client";

import { useEffect, useState } from "react";

interface NavigationItem {
  label: string;
  url: string;
  type: "header" | "footer" | "quick" | "mobile";
  position: number;
  visible: boolean;
}

export default function CityNavigationEditor({ cityId }: { cityId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<NavigationItem[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/admin/settings/city-navigation?cityId=${cityId}`
      );
      const data = await res.json();
      setItems(data);
      setLoading(false);
    }
    load();
  }, [cityId]);

  function updateItem<K extends keyof NavigationItem>(
  index: number,
  field: K,
  value: NavigationItem[K]
) {
  const updated = [...items];
  updated[index] = { ...updated[index], [field]: value };
  setItems(updated);
}

  function addItem() {
    setItems([
      ...items,
      {
        label: "",
        url: "",
        type: "header",
        position: items.length,
        visible: true,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/settings/city-navigation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, items }),
    });
    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">City Navigation</h2>

      <button
        onClick={addItem}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Add Navigation Item
      </button>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border p-4 rounded space-y-2">
            <label className="block">
              <span>Label</span>
              <input
                className="w-full border p-2"
                value={item.label}
                onChange={(e) => updateItem(index, "label", e.target.value)}
              />
            </label>

            <label className="block">
              <span>URL</span>
              <input
                className="w-full border p-2"
                value={item.url}
                onChange={(e) => updateItem(index, "url", e.target.value)}
              />
            </label>

            <label className="block">
              <span>Type</span>
              <select
                className="w-full border p-2"
                value={item.type}
                onChange={(e) => updateItem(index, "type", e.target.value as NavigationItem["type"])}
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="quick">Quick Link</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>

            <label className="block">
              <span>Visible</span>
              <input
                type="checkbox"
                checked={item.visible}
                onChange={(e) => updateItem(index, "visible", e.target.checked)}
              />
            </label>

            <button
              onClick={() => removeItem(index)}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {saving ? "Saving…" : "Save Navigation"}
      </button>
    </div>
  );
}
