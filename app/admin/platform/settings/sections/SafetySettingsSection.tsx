"use client";

import { useEffect, useState } from "react";

export default function SafetySettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    id: "",
    max_quiz_attempts_per_day: 0,
    max_points_per_day: 0,
    fraud_thresholds_json: "{}",
    content_warning_rules_json: "{}",
    child_safety_display_rules_json: "{}",
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/safety", { cache: "no-store" });
      const json = await res.json();

      setSettings({
        ...json,
        fraud_thresholds_json: JSON.stringify(json.fraud_thresholds_json, null, 2),
        content_warning_rules_json: JSON.stringify(json.content_warning_rules_json, null, 2),
        child_safety_display_rules_json: JSON.stringify(json.child_safety_display_rules_json, null, 2),
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
      JSON.parse(settings.fraud_thresholds_json);
      JSON.parse(settings.content_warning_rules_json);
      JSON.parse(settings.child_safety_display_rules_json);
    } catch (err) {
      setError("One or more JSON fields are invalid.");
      setSaving(false);
      return;
    }

    await fetch("/api/admin/settings/safety", {
      method: "PATCH",
      body: JSON.stringify({
        ...settings,
        fraud_thresholds_json: JSON.parse(settings.fraud_thresholds_json),
        content_warning_rules_json: JSON.parse(settings.content_warning_rules_json),
        child_safety_display_rules_json: JSON.parse(settings.child_safety_display_rules_json),
      }),
    });

    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Safety Defaults</h1>

      {error && <div className="text-red-600">{error}</div>}

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

      <div className="flex flex-col gap-2">
        <label>Fraud Thresholds (JSON)</label>
        <textarea
          className="border rounded px-3 py-2 h-40"
          value={settings.fraud_thresholds_json}
          onChange={(e) =>
            setSettings({
              ...settings,
              fraud_thresholds_json: e.target.value,
            })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label>Content Warning Rules (JSON)</label>
        <textarea
          className="border rounded px-3 py-2 h-40"
          value={settings.content_warning_rules_json}
          onChange={(e) =>
            setSettings({
              ...settings,
              content_warning_rules_json: e.target.value,
            })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label>Child Safety Display Rules (JSON)</label>
        <textarea
          className="border rounded px-3 py-2 h-40"
          value={settings.child_safety_display_rules_json}
          onChange={(e) =>
            setSettings({
              ...settings,
              child_safety_display_rules_json: e.target.value,
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
