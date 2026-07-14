"use client";

import { useEffect, useState } from "react";

export default function SystemSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    id: "",
    default_timezone: "",
    default_language: "",
    maintenance_mode: false,
    support_email: "",
    legal_footer_json: {},
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/system", { cache: "no-store" });
      const json = await res.json();
      setSettings(json);
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings/system", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">System Preferences</h1>

      <div className="flex flex-col gap-2">
        <label>Default Timezone</label>
        <input
          className="border rounded px-3 py-2"
          value={settings.default_timezone}
          onChange={(e) =>
            setSettings({ ...settings, default_timezone: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label>Default Language</label>
        <input
          className="border rounded px-3 py-2"
          value={settings.default_language}
          onChange={(e) =>
            setSettings({ ...settings, default_language: e.target.value })
          }
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.maintenance_mode}
          onChange={(e) =>
            setSettings({ ...settings, maintenance_mode: e.target.checked })
          }
        />
        <label>Maintenance Mode</label>
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
