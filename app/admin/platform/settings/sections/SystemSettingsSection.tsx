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
    public_launch_mode: "private", // stored as object
  });

  const [legalFooterText, setLegalFooterText] = useState("{}"); // stored as string for input

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/system", { cache: "no-store" });
      const json = await res.json();

      setSettings(json);

      // Convert JSON → string for the input
      setLegalFooterText(JSON.stringify(json.legal_footer_json, null, 2));

      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);

    let parsedFooter = {};

    try {
      parsedFooter = JSON.parse(legalFooterText);
    } catch (err) {
      alert("Legal footer JSON is invalid.");
      setSaving(false);
      return;
    }

    const payload = {
      ...settings,
      legal_footer_json: parsedFooter,
    };

    await fetch("/api/admin/settings/system", {
      method: "PATCH",
      body: JSON.stringify(payload),
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

      <div className="flex flex-col gap-2">
        <label>Legal Footer JSON</label>
        <textarea
          className="border rounded px-3 py-2 h-40 font-mono"
          value={legalFooterText}
          onChange={(e) => setLegalFooterText(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label>Support Email</label>
        <input
          className="border rounded px-3 py-2"
          value={settings.support_email}
          onChange={(e) =>
            setSettings({ ...settings, support_email: e.target.value })
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

      <div className="flex items-center gap-3">
        <select
  className="border rounded px-3 py-2"
  value={settings.public_launch_mode}
  onChange={(e) =>
    setSettings({ ...settings, public_launch_mode: e.target.value })
  }
>
  <option value="private">Private</option>
  <option value="soft_launch">Soft Launch</option>
  <option value="public">Public</option>
</select>
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
