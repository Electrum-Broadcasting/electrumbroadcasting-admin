"use client";

import { useEffect, useState } from "react";

type EditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextEditor({ label, value, onChange }: EditorProps) {
  return (
    <div className="space-y-2">
      <label className="font-medium">{label}</label>
      <textarea
        className="border rounded px-3 py-2 w-full h-40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function JSONEditor({ label, value, onChange }: EditorProps) {
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

export default function ContentSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  
  const [settings, setSettings] = useState({
    id: "",
    about_html: "",
    privacy_html: "",
    terms_html: "",
    accessibility_html: "",
    contact_html: "",
    faq_json: "[]",
    homepage_sections_json: "{}",
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/content", { cache: "no-store" });
      const json = await res.json();

      setSettings({
        id: json.id,
        about_html: json.about_html,
        privacy_html: json.privacy_html,
        terms_html: json.terms_html,
        accessibility_html: json.accessibility_html,
        contact_html: json.contact_html,
        faq_json: JSON.stringify(json.faq_json, null, 2),
        homepage_sections_json: JSON.stringify(json.homepage_sections_json, null, 2),
      });

      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError("");

    try {
      JSON.parse(settings.faq_json);
      JSON.parse(settings.homepage_sections_json);
    } catch {
      setError("One or more JSON fields are invalid.");
      setSaving(false);
      return;
    }

    await fetch("/api/admin/settings/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: settings.id,
        about_html: settings.about_html,
        privacy_html: settings.privacy_html,
        terms_html: settings.terms_html,
        accessibility_html: settings.accessibility_html,
        contact_html: settings.contact_html,
        faq_json: JSON.parse(settings.faq_json),
        homepage_sections_json: JSON.parse(settings.homepage_sections_json),
      }),
    });

    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Content Settings</h1>

      {error && <div className="text-red-600">{error}</div>}

      <TextEditor
        label="About Page (HTML)"
        value={settings.about_html}
        onChange={(v) => setSettings({ ...settings, about_html: v })}
      />

      <TextEditor
        label="Privacy Policy (HTML)"
        value={settings.privacy_html}
        onChange={(v) => setSettings({ ...settings, privacy_html: v })}
      />

      <TextEditor
        label="Terms of Use (HTML)"
        value={settings.terms_html}
        onChange={(v) => setSettings({ ...settings, terms_html: v })}
      />

      <TextEditor
        label="Accessibility Statement (HTML)"
        value={settings.accessibility_html}
        onChange={(v) => setSettings({ ...settings, accessibility_html: v })}
      />

      <TextEditor
        label="Contact Page (HTML)"
        value={settings.contact_html}
        onChange={(v) => setSettings({ ...settings, contact_html: v })}
      />

      <JSONEditor
        label="FAQ (JSON)"
        value={settings.faq_json}
        onChange={(v) => setSettings({ ...settings, faq_json: v })}
      />

      <JSONEditor
        label="Homepage Sections (JSON)"
        value={settings.homepage_sections_json}
        onChange={(v) =>
          setSettings({ ...settings, homepage_sections_json: v })
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
