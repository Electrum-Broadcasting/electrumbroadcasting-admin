"use client";

import { useEffect, useState } from "react";

export default function SafetySettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    id: "",
    max_quiz_attempts_per_day: 0,
    max_points_per_day: 0,
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/safety", { cache: "no-store" });
      const json = await res.json();
      setSettings(json);
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings/safety", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Safety Defaults</h1>

      <div className="flex flex-col gap-2">
        <label>Max Quiz Attempts Per Day</label>
        <input
          type="number"
          className="border rounded px-3 py-2"
          value={settings.max_quiz_attempts_per_day}
          onChange={(e) =>
            setSettings({
              ...settings,
              max_quiz_attempts_per_day: Number(e.target.value),
            })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label>Max Points Per Day</label>
        <input
          type="number"
          className="border rounded px-3 py-2"
          value={settings.max_points_per_day}
          onChange={(e) =>
            setSettings({
              ...settings,
              max_points_per_day: Number(e.target.value),
            })
          }
        />
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
