"use client";

import { ColorInput, SelectInput } from "./ThemeInputs";
import { ThemePreview } from "./ThemePreview";
import { useThemeState } from "./ThemeState";
import { Button } from "@/components/ui/button";
import { ThemeStatusBadge } from "./ThemeStatusBadge";

const AVAILABLE_FONTS = [
  "Inter",
  "Montserrat",
  "Roboto",
  "Lato",
  "Merriweather",
  "Source Sans Pro",
] as const;

export function ThemeEditor({
  city,
  draftTheme,
  publishedTheme,
}: {
  city: any;
  draftTheme: any;
  publishedTheme: any;
}) {
  const {
    localDraftTheme,
    savedDraftTheme,
    savedPublishedTheme,
    isEditing,
    loading,
    updateTheme,
    saveDraft,
    publishTheme,
    restoreDefaults,
  } = useThemeState(city, draftTheme, publishedTheme);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* LEFT: Editor */}
      <div className="space-y-10">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Editing theme for</p>
            <h2 className="text-xl font-semibold text-ink">
              {city.name ?? city.id}
            </h2>
          </div>

          {/* FIXED: Badge now uses updated state */}
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
              value={localDraftTheme.colors.primary}
              onChange={(v: string) => updateTheme("colors", "primary", v)}
            />

            <ColorInput
              label="Secondary"
              value={localDraftTheme.colors.secondary}
              onChange={(v: string) => updateTheme("colors", "secondary", v)}
            />

            <ColorInput
              label="Accent"
              value={localDraftTheme.colors.accent}
              onChange={(v: string) => updateTheme("colors", "accent", v)}
            />

            <ColorInput
              label="Background"
              value={localDraftTheme.colors.background}
              onChange={(v: string) => updateTheme("colors", "background", v)}
            />

            <ColorInput
              label="Foreground"
              value={localDraftTheme.colors.foreground}
              onChange={(v: string) => updateTheme("colors", "foreground", v)}
            />
          </div>
        </section>

        {/* Typography */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">Typography</h3>

          <div className="space-y-4">
            <SelectInput
              label="Heading Font"
              value={localDraftTheme.typography.heading}
              options={AVAILABLE_FONTS}
              onChange={(v: string) => updateTheme("typography", "heading", v)}
            />

            <SelectInput
              label="Body Font"
              value={localDraftTheme.typography.body}
              options={AVAILABLE_FONTS}
              onChange={(v: string) => updateTheme("typography", "body", v)}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-6">
          <Button onClick={saveDraft} type="button" disabled={loading}>
            Save Draft
          </Button>

          <Button
            onClick={restoreDefaults}
            type="button"
            disabled={loading}
            variant="secondary"
          >
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
