// /app/admin/platform/settings/page.tsx

"use client";

import { useEffect, useState } from "react";

export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [platformName, setPlatformName] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Load settings from API
  useEffect(() => {
    async function loadSettings() {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
        const res = await fetch(`${base}/api/platform/settings`, {
          cache: "no-store",
        });

        if (res.ok) {
          const json = await res.json();
          setPlatformName(json.platform_name ?? "");
          setMaintenanceMode(json.maintenance_mode ?? false);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
      const res = await fetch(`${base}/api/platform/settings`, {
        method: "POST",
        body: JSON.stringify({
          platform_name: platformName,
          maintenance_mode: maintenanceMode,
        }),
      });

      if (!res.ok) {
        console.error("Failed to save settings:", await res.text());
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Platform Settings</h1>

      <p className="text-sm text-gray-600 mb-6">
        These settings control global platform behavior and defaults.
      </p>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading settings…</div>
      ) : (
        <div className="space-y-6">
          {/* Platform Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Platform Name</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
              placeholder="Electrum"
            />
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
            />
            <label className="text-sm font-medium">Maintenance Mode</label>
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
