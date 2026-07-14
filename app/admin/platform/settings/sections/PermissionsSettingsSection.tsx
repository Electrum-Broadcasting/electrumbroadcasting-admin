"use client";

import { useEffect, useState } from "react";

export default function PermissionsSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    id: "",
    editor_permissions_json: {},
    contributor_permissions_json: {},
    city_admin_permissions_json: {},
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/permissions", { cache: "no-store" });
      const json = await res.json();
      setSettings(json);
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings/permissions", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Permissions</h1>

      <p className="text-sm text-gray-600">
        Permissions JSON fields will be editable in a future UI.
      </p>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {saving ? "Saving…" : "Save Permissions"}
      </button>
    </div>
  );
}
