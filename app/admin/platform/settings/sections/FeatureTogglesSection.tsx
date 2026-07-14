"use client";

import { useEffect, useState } from "react";

type FeatureToggle = {
  feature_name: string;
  enabled: boolean;
};

export default function FeatureTogglesSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toggles, setToggles] = useState<FeatureToggle[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/features", { cache: "no-store" });
      const json = await res.json();
      setToggles(json);
      setLoading(false);
    }
    load();
  }, []);

  async function updateToggle(name: string, enabled: boolean) {
    setSaving(true);
    await fetch("/api/admin/settings/features", {
      method: "PATCH",
      body: JSON.stringify({ feature_name: name, enabled }),
    });

    // update local state so UI feels responsive
    setToggles((prev) =>
      prev.map((t) =>
        t.feature_name === name ? { ...t, enabled } : t
      )
    );

    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Feature Toggles</h1>

      {toggles.map((t) => (
        <div key={t.feature_name} className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={t.enabled}
            onChange={(e) => updateToggle(t.feature_name, e.target.checked)}
          />
          <label>{t.feature_name}</label>
        </div>
      ))}

      {saving && <div className="text-sm text-gray-500">Saving…</div>}
    </div>
  );
}
