"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loadMergedTheme } from "@/lib/themes/loadTheme";
import defaultTheme from "@/themes/default.json";

type ThemeObject = Record<string, unknown>;

export type ThemePersistence = {
  saveDraft: (theme: ThemeObject) => Promise<void>;
  publishTheme: (theme: ThemeObject) => Promise<void>;
};

function cloneTheme(theme: unknown): ThemeObject {
  return theme && typeof theme === "object" && !Array.isArray(theme)
    ? structuredClone(theme as ThemeObject)
    : {};
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function themesMatch(left: unknown, right: unknown) {
  return stableSerialize(left ?? null) === stableSerialize(right ?? null);
}

export function useThemeState(
  city: { id: string },
  draftTheme: unknown,
  publishedTheme: unknown,
  globalTheme: unknown,
  persistence?: ThemePersistence
) {
  const [localDraftTheme, setLocalDraftTheme] = useState<ThemeObject>(() =>
    loadMergedTheme(draftTheme ?? publishedTheme, globalTheme ?? defaultTheme) as ThemeObject
  );
  const [savedDraftTheme, setSavedDraftTheme] = useState<ThemeObject | null>(
    draftTheme ? cloneTheme(draftTheme) : null
  );
  const [savedPublishedTheme, setSavedPublishedTheme] = useState<ThemeObject>(
    cloneTheme(publishedTheme)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalDraftTheme(
      loadMergedTheme(draftTheme ?? publishedTheme, globalTheme ?? defaultTheme) as ThemeObject
    );
    setSavedDraftTheme(draftTheme ? cloneTheme(draftTheme) : null);
    setSavedPublishedTheme(cloneTheme(publishedTheme));
  }, [draftTheme, globalTheme, publishedTheme]);

  const isEditing = !themesMatch(
    localDraftTheme,
    loadMergedTheme(savedDraftTheme ?? savedPublishedTheme, globalTheme ?? defaultTheme)
  );

  function updateThemePath(path: string[], value: unknown) {
    setLocalDraftTheme((previous) => {
      const next = structuredClone(previous);
      let cursor: Record<string, unknown> = next;
      for (const segment of path.slice(0, -1)) {
        const current = cursor[segment];
        if (!current || typeof current !== "object" || Array.isArray(current)) {
          cursor[segment] = {};
        }
        cursor = cursor[segment] as Record<string, unknown>;
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
  }

  function updateTheme(section: string, key: string, value: unknown) {
    updateThemePath([section, key], value);
  }

  async function sendTheme(payload: Record<string, unknown>, errorLabel: string) {
    const response = await fetch(`/api/admin/themes/${city.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    if (!response.ok) {
      throw new Error(result?.error ?? errorLabel);
    }
  }

  async function saveDraft() {
    setLoading(true);
    try {
      if (persistence) {
        await persistence.saveDraft(localDraftTheme);
      } else {
        await sendTheme({ draft_theme: localDraftTheme }, "Failed to save draft");
      }
      setSavedDraftTheme(structuredClone(localDraftTheme));
      toast.success("Draft theme saved");
    } catch (error) {
      console.error("Failed to save draft theme:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save draft theme"
      );
    } finally {
      setLoading(false);
    }
  }

  async function publishTheme() {
    setLoading(true);
    try {
      if (persistence) {
        await persistence.publishTheme(localDraftTheme);
      } else {
        await sendTheme(
          { draft_theme: null, published_theme: localDraftTheme },
          "Failed to publish theme"
        );
      }
      setSavedPublishedTheme(structuredClone(localDraftTheme));
      setSavedDraftTheme(null);
      toast.success("Theme published");
    } catch (error) {
      console.error("Failed to publish theme:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to publish theme"
      );
    } finally {
      setLoading(false);
    }
  }

  async function restoreDefaults() {
    const defaultDraft = loadMergedTheme(globalTheme ?? defaultTheme) as ThemeObject;
    setLoading(true);
    try {
      if (persistence) {
        await persistence.saveDraft(defaultDraft);
      } else {
        await sendTheme(
          { draft_theme: defaultDraft },
          "Failed to restore defaults"
        );
      }
      setLocalDraftTheme(defaultDraft);
      setSavedDraftTheme(structuredClone(defaultDraft));
      toast.success("Default theme restored");
    } catch (error) {
      console.error("Failed to restore theme defaults:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to restore defaults"
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    localDraftTheme,
    savedDraftTheme,
    savedPublishedTheme,
    isEditing,
    loading,
    updateTheme,
    updateThemePath,
    saveDraft,
    publishTheme,
    restoreDefaults,
  };
}
