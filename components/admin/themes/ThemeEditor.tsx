"use client";

import { useEffect, useState } from "react";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeStatusBadge } from "./ThemeStatusBadge";
import { ThemePreview } from "./ThemePreview";
import { useThemeState } from "./ThemeState";
import type { ThemePersistence } from "./ThemeState";

const AVAILABLE_FONTS = [
  "Inter",
  "Montserrat",
  "Roboto",
  "Lato",
  "Merriweather",
  "Source Sans Pro",
] as const;

type ThemeRecord = Record<string, unknown>;
type ThemePath = string[];

const ROOT_COLOR_KEYS = [
  "background",
  "foreground",
  "primary",
  "primary_foreground",
  "secondary",
  "secondary_foreground",
  "accent",
  "accent_foreground",
  "destructive",
  "destructive_foreground",
  "ink",
  "gold",
  "gold_glow",
  "card",
  "card_foreground",
  "popover",
  "popover_foreground",
  "muted",
  "muted_foreground",
  "header_solid",
  "museum_warm",
  "border",
  "input",
  "ring",
  "chart_1",
  "chart_2",
  "chart_3",
  "chart_4",
  "chart_5",
  "sidebar",
  "sidebar_foreground",
  "sidebar_primary",
  "sidebar_primary_foreground",
  "sidebar_accent",
  "sidebar_accent_foreground",
  "sidebar_border",
  "sidebar_ring",
];

const EDITOR_SECTIONS: Array<{
  title: string;
  path: ThemePath;
  rootKeys?: string[];
  description?: string;
}> = [
  { title: "Colors", path: ["colors"], rootKeys: ROOT_COLOR_KEYS },
  { title: "Typography", path: ["typography"] },
  { title: "Spacing", path: ["spacing"] },
  { title: "Radius", path: ["radius"], rootKeys: ["radius_base", "radius_round", "radius_search_input"] },
  { title: "Shadows", path: ["shadows"], rootKeys: ["shadow_museum_tile", "shadow_search_input"] },
  { title: "Motion", path: ["motion"] },
  { title: "Layout", path: ["layout"] },
  { title: "Cards", path: ["cards"] },
  { title: "Sections", path: ["sections"] },
  { title: "Hero", path: ["hero"] },
  { title: "Gallery", path: ["gallery"] },
  { title: "Panorama", path: ["panorama"] },
  { title: "Hotspots", path: ["hotspots"] },
  { title: "Timeline", path: ["timeline"] },
  { title: "Objects", path: ["objects"] },
];

function isRecord(value: unknown): value is ThemeRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getAtPath(value: ThemeRecord, path: ThemePath): unknown {
  return path.reduce<unknown>((current, key) => {
    return isRecord(current) ? current[key] : undefined;
  }, value);
}

function colorPickerValue(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
}

function isColorField(key: string, value: unknown) {
  return (
    typeof value === "string" &&
    (key.toLowerCase().includes("color") ||
      ROOT_COLOR_KEYS.includes(key) ||
      key === "ink" ||
      key === "gold")
  );
}

function sliderBounds(path: ThemePath, value: number) {
  const key = path[path.length - 1].toLowerCase();
  if (key.includes("radius")) return { min: 0, max: 32, step: 1 };
  if (key.includes("opacity") || key.includes("alpha")) {
    return { min: 0, max: 1, step: 0.01 };
  }
  if (key.includes("pitch")) return { min: 0, max: 90, step: 1 };
  if (key.includes("rotate") || key.includes("deg")) {
    return { min: 0, max: 5, step: 0.1 };
  }
  if (value >= 0 && value <= 1) return { min: 0, max: 1, step: 0.01 };
  return null;
}

function ArrayValueEditor({
  label,
  value,
  path,
  onChange,
}: {
  label: string;
  value: unknown[];
  path: ThemePath;
  onChange: (path: ThemePath, value: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState("");

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  function apply() {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Value must be a JSON array.");
      onChange(path, parsed);
      setError("");
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Invalid JSON array.");
    }
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor={`theme-${path.join("-")}`} className="capitalize">{label}</Label>
      <textarea
        id={`theme-${path.join("-")}`}
        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
      />
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={apply}>
          Apply array
        </Button>
      </div>
    </div>
  );
}

function ThemeValueEditor({
  label,
  value,
  path,
  onChange,
}: {
  label: string;
  value: unknown;
  path: ThemePath;
  onChange: (path: ThemePath, value: unknown) => void;
}) {
  if (isRecord(value)) {
    const entries = Object.entries(value);
    return (
      <div className="space-y-3">
        {entries.map(([key, child]) => (
          <ThemeValueEditor
            key={key}
            label={key.replaceAll("_", " ")}
            value={child}
            path={[...path, key]}
            onChange={onChange}
          />
        ))}
      </div>
    );
  }

  const fieldId = `theme-${path.join("-")}`;
  if (Array.isArray(value)) {
    return (
      <ArrayValueEditor
        label={label}
        value={value}
        path={path}
        onChange={onChange}
      />
    );
  }
  if (typeof value === "boolean") {
    return (
      <label htmlFor={fieldId} className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium capitalize">{label}</span>
        <input
          id={fieldId}
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={value}
          onChange={(event) => onChange(path, event.target.checked)}
        />
      </label>
    );
  }

  if (typeof value === "number") {
    const bounds = sliderBounds(path, value);
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="capitalize">{label}</Label>
        {bounds ? (
          <input
            aria-label={`${label} slider`}
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={bounds.step}
            value={Math.min(bounds.max, Math.max(bounds.min, value))}
            onChange={(event) => onChange(path, Number(event.target.value))}
            className="w-full accent-primary"
          />
        ) : null}
        <Input
          id={fieldId}
          type="number"
          step={bounds?.step ?? "any"}
          value={value}
          onChange={(event) => onChange(path, Number(event.target.value))}
        />
      </div>
    );
  }

  if (typeof value === "string" && isColorField(path[path.length - 1], value)) {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="capitalize">{label}</Label>
        <div className="flex items-center gap-3">
          <input
            aria-label={`${label} color picker`}
            type="color"
            value={colorPickerValue(value)}
            onChange={(event) => onChange(path, event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
          />
          <Input
            id={fieldId}
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
            placeholder="CSS color value"
          />
        </div>
      </div>
    );
  }

  if (
    typeof value === "string" &&
    /^(heading|body|display|serif)$/.test(path[path.length - 1]) &&
    path.includes("typography")
  ) {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="capitalize">{label}</Label>
        <select
          id={fieldId}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={value}
          onChange={(event) => onChange(path, event.target.value)}
        >
          {[...new Set([value, ...AVAILABLE_FONTS])].map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="capitalize">{label}</Label>
        <Input
          id={fieldId}
          value={value}
          onChange={(event) => onChange(path, event.target.value)}
        />
      </div>
    );
  }

  if (value === null) {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="capitalize">{label}</Label>
        <Input
          id={fieldId}
          value=""
          placeholder="Not set"
          onChange={(event) => onChange(path, event.target.value)}
        />
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {label}: No editable value is stored.
    </p>
  );
}

function compareThemes(draft: unknown, published: unknown) {
  const changes: Array<{ path: string; draft: unknown; published: unknown }> = [];

  function walk(left: unknown, right: unknown, path: string[]) {
    if (isRecord(left) || isRecord(right)) {
      const leftRecord = isRecord(left) ? left : {};
      const rightRecord = isRecord(right) ? right : {};
      for (const key of new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])) {
        walk(leftRecord[key], rightRecord[key], [...path, key]);
      }
      return;
    }
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      changes.push({
        path: path.join("."),
        draft: left,
        published: right,
      });
    }
  }

  walk(draft, published, []);
  return changes;
}

export function ThemeEditor({
  city,
  draftTheme,
  publishedTheme,
  globalTheme,
  persistence,
  subjectLabel,
}: {
  city: { id: string; name?: string | null };
  draftTheme: unknown;
  publishedTheme: unknown;
  globalTheme: unknown;
  persistence?: ThemePersistence;
  subjectLabel?: string;
}) {
  const {
    localDraftTheme,
    savedDraftTheme,
    savedPublishedTheme,
    isEditing,
    loading,
    updateThemePath,
    saveDraft,
    publishTheme,
    restoreDefaults,
  } = useThemeState(city, draftTheme, publishedTheme, globalTheme, persistence);
  const [showDiff, setShowDiff] = useState(false);

  const coveredRootKeys = new Set<string>(
    EDITOR_SECTIONS.flatMap((section) => [section.path[0], ...(section.rootKeys ?? [])])
  );
  const otherKeys = Object.keys(localDraftTheme).filter(
    (key) => !coveredRootKeys.has(key)
  );

  const themeDiff = compareThemes(
    savedDraftTheme ?? localDraftTheme,
    savedPublishedTheme
  );

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground">
              Editing {subjectLabel ?? "city theme"}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {city.name ?? city.id}
            </h2>
          </div>
          <ThemeStatusBadge
            draftTheme={savedDraftTheme}
            publishedTheme={savedPublishedTheme}
          />
        </div>

        {EDITOR_SECTIONS.map((section, index) => {
          const value = getAtPath(localDraftTheme, section.path);
          const nestedObject = isRecord(value) ? value : null;
          const directKeys =
            section.rootKeys?.filter(
              (key) => key in localDraftTheme && !(nestedObject && key in nestedObject)
            ) ?? [];
          const fields: Array<[string, unknown, ThemePath]> = [
            ...(nestedObject
              ? Object.entries(nestedObject).map(
                  ([key, child]): [string, unknown, ThemePath] => [key, child, [...section.path, key]]
                )
              : []),
            ...directKeys.map(
              (key): [string, unknown, ThemePath] => [key, localDraftTheme[key], [key]]
            ),
          ];

          return (
            <CollapsibleSection
              key={section.title}
              title={section.title}
              description={section.description}
              defaultOpen={index < 2}
            >
              {fields.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {fields.map(([key, child, fieldPath]) => (
                    <ThemeValueEditor
                      key={fieldPath.join(".")}
                      label={key.replaceAll("_", " ")}
                      value={child}
                      path={fieldPath}
                      onChange={updateThemePath}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No {section.title.toLowerCase()} fields are present in this theme.
                </p>
              )}
            </CollapsibleSection>
          );
        })}

        {otherKeys.length ? (
          <CollapsibleSection
            title="Other"
            description="Theme fields not covered by the sections above."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {otherKeys.map((key) => (
                <ThemeValueEditor
                  key={key}
                  label={key.replaceAll("_", " ")}
                  value={localDraftTheme[key]}
                  path={[key]}
                  onChange={updateThemePath}
                />
              ))}
            </div>
          </CollapsibleSection>
        ) : null}

        <CollapsibleSection title="Draft vs published" description="Review stored changes before publishing.">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {themeDiff.length} changed {themeDiff.length === 1 ? "field" : "fields"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDiff((visible) => !visible)}
            >
              {showDiff ? "Hide diff" : "Show diff"}
            </Button>
          </div>
          {showDiff ? (
            <div className="mt-4 space-y-3">
              {themeDiff.length ? themeDiff.map((change) => (
                <div key={change.path} className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">{change.path || "Theme"}</p>
                  <p className="mt-1 break-words text-muted-foreground">
                    Draft: {JSON.stringify(change.draft) ?? "unset"}
                  </p>
                  <p className="break-words text-muted-foreground">
                    Published: {JSON.stringify(change.published) ?? "unset"}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">Draft and published themes match.</p>
              )}
            </div>
          ) : null}
        </CollapsibleSection>

        <div className="flex flex-wrap justify-end gap-2 rounded-lg border border-border bg-card p-4">
          <Button
            type="button"
            variant="outline"
            onClick={restoreDefaults}
            disabled={loading}
          >
            Restore defaults
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={saveDraft}
            disabled={loading || !isEditing}
          >
            Save draft
          </Button>
          <Button
            type="button"
            onClick={publishTheme}
            disabled={loading}
          >
            Publish
          </Button>
        </div>
      </div>

      <aside className="xl:sticky xl:top-4">
        <ThemePreview
          draftTheme={localDraftTheme}
          publishedTheme={savedPublishedTheme}
          isEditing={isEditing}
        />
      </aside>
    </div>
  );
}
