"use client";

import { useState } from "react";
import { ThemePreview } from "@/components/admin/themes/ThemePreview";

export function ThemeForm({ city, theme }: { city: any; theme: any }) {
  const [localTheme, setLocalTheme] = useState(theme);
  const [status, setStatus] = useState(city.theme_status ?? "draft");
  const [loading, setLoading] = useState(false);

  function updateTheme(section: string, key: string, value: any) {
    setTheme((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section] ?? {}),
        [key]: value,
      },
    }));
  }

  async function saveDraft() {
    setLoading(true);

    await fetch(`/api/admin/themes/${city.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, status: "draft" }),
    });

    setStatus("draft");
    setLoading(false);
  }

  async function publishTheme() {
    setLoading(true);

    await fetch(`/api/admin/themes/${city.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, status: "published" }),
    });

    setStatus("published");
    setLoading(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* LEFT: Editor */}
      <div className="space-y-10">

        {/* Colors */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">Colors</h3>

          <div className="space-y-4">
            <ColorInput
              label="Primary"
              value={theme.colors?.primary ?? "#000000"}
              onChange={(v) => updateTheme("colors", "primary", v)}
            />

            <ColorInput
              label="Secondary"
              value={theme.colors?.secondary ?? "#666666"}
              onChange={(v) => updateTheme("colors", "secondary", v)}
            />

            <ColorInput
              label="Accent"
              value={theme.colors?.accent ?? "#FF9900"}
              onChange={(v) => updateTheme("colors", "accent", v)}
            />
          </div>
        </section>

        {/* Typography */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">Typography</h3>

          <div className="space-y-4">
            <TextInput
              label="Heading Font"
              value={theme.typography?.heading ?? "Inter"}
              onChange={(v) => updateTheme("typography", "heading", v)}
            />

            <TextInput
              label="Body Font"
              value={theme.typography?.body ?? "Inter"}
              onChange={(v) => updateTheme("typography", "body", v)}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={saveDraft}
            disabled={loading}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save Draft
          </button>

          <button
            onClick={publishTheme}
            disabled={loading}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
          >
            Publish Theme
          </button>
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <ThemePreview theme={theme} />
    </div>
  );
}

function ColorInput({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="color"
        className="mt-1 h-10 w-20 cursor-pointer rounded border border-slate-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextInput({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
