"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type EditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextEditor({ label, value, onChange }: EditorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <textarea
        className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function JSONEditor({ label, value, onChange }: EditorProps) {
  return (
    <CollapsibleSection title={label}>
        <textarea
          className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
    </CollapsibleSection>
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
      try {
        const res = await fetch("/api/admin/settings/content", {
          cache: "no-store",
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load content settings");
        setSettings({
          id: json.id,
          about_html: json.about_html ?? "",
          privacy_html: json.privacy_html ?? "",
          terms_html: json.terms_html ?? "",
          accessibility_html: json.accessibility_html ?? "",
          contact_html: json.contact_html ?? "",
          faq_json: JSON.stringify(json.faq_json ?? [], null, 2),
          homepage_sections_json: JSON.stringify(json.homepage_sections_json ?? {}, null, 2),
        });
      } catch (loadError) {
        console.error("Failed to load content settings:", loadError);
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load content settings";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
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

    try {
      const response = await fetch("/api/admin/settings/content", {
        method: "PATCH",
        credentials: "include",
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
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to save content settings");
      toast.success("Content settings saved");
    } catch (saveError) {
      console.error("Failed to save content settings:", saveError);
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save content settings";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading content settings…</p>;
  if (error && !settings.id) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <CollapsibleSection title="Public page content" defaultOpen>
        <div className="space-y-5">
          <TextEditor
            label="About page (HTML)"
            value={settings.about_html}
            onChange={(v) => setSettings({ ...settings, about_html: v })}
          />
          <TextEditor
            label="Privacy policy (HTML)"
            value={settings.privacy_html}
            onChange={(v) => setSettings({ ...settings, privacy_html: v })}
          />
          <TextEditor
            label="Terms of use (HTML)"
            value={settings.terms_html}
            onChange={(v) => setSettings({ ...settings, terms_html: v })}
          />
          <TextEditor
            label="Accessibility statement (HTML)"
            value={settings.accessibility_html}
            onChange={(v) => setSettings({ ...settings, accessibility_html: v })}
          />
          <TextEditor
            label="Contact page (HTML)"
            value={settings.contact_html}
            onChange={(v) => setSettings({ ...settings, contact_html: v })}
          />
        </div>
      </CollapsibleSection>
      <JSONEditor
        label="FAQ"
        value={settings.faq_json}
        onChange={(v) => setSettings({ ...settings, faq_json: v })}
      />
      <JSONEditor
        label="Homepage sections"
        value={settings.homepage_sections_json}
        onChange={(v) => setSettings({ ...settings, homepage_sections_json: v })}
      />
      <div className="flex justify-end">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save content settings"}
        </Button>
      </div>
    </div>
  );
}
