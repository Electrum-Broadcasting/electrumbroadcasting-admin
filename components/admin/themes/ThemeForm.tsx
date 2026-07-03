"use client";

import { useEffect, useState } from "react";
import { ThemeStatusBadge } from "@/components/admin/themes/ThemeStatusBadge";
import { ThemePreview } from "@/components/admin/themes/ThemePreview";
import { Button } from "@/components/ui/button";
import { loadMergedTheme } from "@/lib/themes/loadTheme";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import defaultTheme from "@/themes/default.json";

const AVAILABLE_FONTS = [
  "Inter",
  "Montserrat",
  "Roboto",
  "Lato",
  "Merriweather",
  "Source Sans Pro",
] as const;

function themesMatch(leftTheme: any, rightTheme: any) {
  return JSON.stringify(leftTheme ?? null) === JSON.stringify(rightTheme ?? null);
}

export function ThemeForm({
  city,
  draftTheme,
  publishedTheme,
}: {
  city: any;
  draftTheme: any;
  publishedTheme: any;
}) {
  const router = useRouter();
  const [localDraftTheme, setLocalDraftTheme] = useState(loadMergedTheme(draftTheme ?? publishedTheme));
  const [savedDraftTheme, setSavedDraftTheme] = useState(draftTheme);
  const [savedPublishedTheme, setSavedPublishedTheme] = useState(publishedTheme);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalDraftTheme(loadMergedTheme(draftTheme ?? publishedTheme));
    setSavedDraftTheme(draftTheme);
    setSavedPublishedTheme(publishedTheme);
  }, [draftTheme, publishedTheme]);

  const isEditing = !themesMatch(
    localDraftTheme,
    loadMergedTheme(savedDraftTheme ?? savedPublishedTheme)
  );

  function updateTheme(section: string, key: string, value: any) {
    setLocalDraftTheme((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section] ?? {}),
        [key]: value,
      },
    }));
  }

  async function saveDraft() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/themes/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_theme: localDraftTheme }),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft theme");
      }

      setSavedDraftTheme(localDraftTheme);
      toast.success("Draft theme saved");
    } catch {
      toast.error("Failed to save draft theme");
    } finally {
      setLoading(false);
    }
  }

  async function publishTheme() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/themes/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_theme: localDraftTheme,
          published_theme: localDraftTheme,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish theme");
      }

      setSavedDraftTheme(localDraftTheme);
      setSavedPublishedTheme(localDraftTheme);
      toast.success("Theme published");
      router.refresh();
    } catch {
      toast.error("Failed to publish theme");
    } finally {
      setLoading(false);
    }
  }

  async function restoreDefaults() {
    setLoading(true);
    const defaultDraftTheme = loadMergedTheme(defaultTheme);

    try {
      const response = await fetch(`/api/admin/themes/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_theme: defaultDraftTheme }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore default theme");
      }

      setLocalDraftTheme(defaultDraftTheme);
      setSavedDraftTheme(defaultDraftTheme);
      toast.success("Default theme restored to draft");
    } catch {
      toast.error("Failed to restore defaults");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* LEFT: Editor */}
      <div className="space-y-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Editing theme for</p>
            <h2 className="text-xl font-semibold text-ink">
              {city.name ?? city.id}
            </h2>
          </div>

          <ThemeStatusBadge
            draftTheme={savedDraftTheme}
            publishedTheme={savedPublishedTheme}
          />
        </div>

        {/* Colors */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">Colors</h3>

          <div className="space-y-4">
            <ColorInput
              label="Primary"
              value={localDraftTheme.colors?.primary ?? "#000000"}
              onChange={(v) => updateTheme("colors", "primary", v)}
            />

            <ColorInput
              label="Secondary"
              value={localDraftTheme.colors?.secondary ?? "#666666"}
              onChange={(v) => updateTheme("colors", "secondary", v)}
            />

            <ColorInput
              label="Accent"
              value={localDraftTheme.colors?.accent ?? "#FF9900"}
              onChange={(v) => updateTheme("colors", "accent", v)}
            />

            <ColorInput
              label="Background"
              value={localDraftTheme.colors?.background ?? "#ffffff"}
              onChange={(v) => updateTheme("colors", "background", v)}
            />

            <ColorInput
              label="Foreground"
              value={localDraftTheme.colors?.foreground ?? "#000000"}
              onChange={(v) => updateTheme("colors", "foreground", v)}
            />
          </div>
        </section>

        {/* Typography */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">Typography</h3>

          <div className="space-y-4">
            <SelectInput
              label="Heading Font"
              value={localDraftTheme.typography?.heading_font_family ?? localDraftTheme.typography?.heading ?? "Inter"}
              options={AVAILABLE_FONTS}
              onChange={(v) => {
                updateTheme("typography", "heading_font_family", v);
                updateTheme("typography", "heading", v);
              }}
            />

            <SelectInput
              label="Body Font"
              value={localDraftTheme.typography?.font_family ?? localDraftTheme.typography?.body ?? "Inter"}
              options={AVAILABLE_FONTS}
              onChange={(v) => {
                updateTheme("typography", "font_family", v);
                updateTheme("typography", "body", v);
              }}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-6">
          <Button onClick={saveDraft} type="button" disabled={loading}>
            Save Draft
          </Button>

          <Button onClick={restoreDefaults} type="button" disabled={loading} variant="secondary">
            Restore Defaults
          </Button>

          <Button onClick={publishTheme} type="button" disabled={loading}>
            Publish Theme
          </Button>
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <ThemePreview
        draftTheme={localDraftTheme}
        publishedTheme={savedPublishedTheme}
        isEditing={isEditing}
      />
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

function SelectInput({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <select
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
