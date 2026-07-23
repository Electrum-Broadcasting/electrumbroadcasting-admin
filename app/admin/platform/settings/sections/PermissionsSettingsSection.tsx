"use client";

import { useEffect, useState } from "react";

function CollapsibleJSON({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded p-3">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium">{label}</span>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <textarea
          className="border rounded px-3 py-2 mt-3 w-full h-40"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function PermissionsSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    id: "",
    editor_permissions_json: "{}",
    contributor_permissions_json: "{}",
    city_admin_permissions_json: "{}",
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/permissions", {
        cache: "no-store",
      });
      const json = await res.json();

      setSettings({
        ...json,
        editor_permissions_json: JSON.stringify(
          json.editor_permissions_json,
          null,
          2
        ),
        contributor_permissions_json: JSON.stringify(
          json.contributor_permissions_json,
          null,
          2
        ),
        city_admin_permissions_json: JSON.stringify(
          json.city_admin_permissions_json,
          null,
          2
        ),
      });

      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError("");

    // Validate JSON fields
    try {
      JSON.parse(settings.editor_permissions_json);
      JSON.parse(settings.contributor_permissions_json);
      JSON.parse(settings.city_admin_permissions_json);
    } catch {
      setError("One or more JSON fields are invalid.");
      setSaving(false);
      return;
    }

    await fetch("/api/admin/settings/permissions", {
      method: "PATCH",
      body: JSON.stringify({
        ...settings,
        editor_permissions_json: JSON.parse(
          settings.editor_permissions_json
        ),
        contributor_permissions_json: JSON.parse(
          settings.contributor_permissions_json
        ),
        city_admin_permissions_json: JSON.parse(
          settings.city_admin_permissions_json
        ),
      }),
    });

    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Permissions Settings</h1>

      {error && <div className="text-red-600">{error}</div>}

      <CollapsibleJSON
        label="Editor Permissions (JSON)"
        value={settings.editor_permissions_json}
        onChange={(v) =>
          setSettings({ ...settings, editor_permissions_json: v })
        }
      />

      <CollapsibleJSON
        label="Contributor Permissions (JSON)"
        value={settings.contributor_permissions_json}
        onChange={(v) =>
          setSettings({ ...settings, contributor_permissions_json: v })
        }
      />

      <CollapsibleJSON
        label="City Admin Permissions (JSON)"
        value={settings.city_admin_permissions_json}
        onChange={(v) =>
          setSettings({ ...settings, city_admin_permissions_json: v })
        }
      />

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
