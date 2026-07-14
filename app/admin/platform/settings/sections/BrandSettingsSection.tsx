"use client";

import { useEffect, useState } from "react";

export default function BrandSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    id: "",
    primary_color: "",
    secondary_color: "",
    iconography_style: "",
    dark_mode_enabled: false,
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/brand", { cache: "no-store" });
      const json = await res.json();
      setSettings(json);
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings/brand", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Brand & Theme Defaults</h1>

      <div className="flex flex-col gap-2">
        <label>Primary Color</label>
        <input
          className="border rounded px-3 py-2"
          value={settings.primary_color}
          onChange={(e) =>
            setSettings({ ...settings, primary_color: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label>Secondary Color</label>
        <input
          className="border rounded px-3 py-2"
          value={settings.secondary_color}
          onChange={(e) =>
            setSettings({ ...settings, secondary_color: e.target.value })
          }
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.dark_mode_enabled}
          onChange={(e) =>
            setSettings({ ...settings, dark_mode_enabled: e.target.checked })
          }
        />
        <label>Enable Dark Mode</label>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
