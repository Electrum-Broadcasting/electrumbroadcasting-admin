"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { loadMergedTheme } from "@/lib/themes/loadTheme";
import defaultTheme from "@/themes/default.json";

/**
 * Canonical theme shape sanitizer
 * Ensures ThemeForm, ThemePreview, and loadMergedTheme all operate on the same schema.
 */
function sanitizeTheme(theme: any) {
  return {
    colors: {
      primary: theme?.colors?.primary,
      secondary: theme?.colors?.secondary,
      accent: theme?.colors?.accent,
      background: theme?.colors?.background,
      foreground: theme?.colors?.foreground,
    },
    typography: {
      heading: theme?.typography?.heading,
      body: theme?.typography?.body,
    },
  };
}

/**
 * Deep equality check for canonical theme objects.
 */
function themesMatch(left: any, right: any) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

/**
 * Theme state manager for ThemeForm
 */
export function useThemeState(city: any, draftTheme: any, publishedTheme: any) {
  const [localDraftTheme, setLocalDraftTheme] = useState(
    loadMergedTheme(sanitizeTheme(draftTheme ?? publishedTheme))
  );

  const [savedDraftTheme, setSavedDraftTheme] =
  useState<any | null>(sanitizeTheme(draftTheme));


  const [savedPublishedTheme, setSavedPublishedTheme] = useState(
    sanitizeTheme(publishedTheme)
  );

  const [loading, setLoading] = useState(false);

  /**
   * Reinitialize when server props change
   */
  useEffect(() => {
  const sanitizedDraft = draftTheme ? sanitizeTheme(draftTheme) : null;

  setLocalDraftTheme(
    loadMergedTheme(sanitizeTheme(draftTheme ?? publishedTheme))
  );

  setSavedDraftTheme(sanitizedDraft);
  setSavedPublishedTheme(sanitizeTheme(publishedTheme));
}, [draftTheme, publishedTheme]);


  /**
   * Whether the user has unsaved changes
   */
  const isEditing = !themesMatch(
    localDraftTheme,
    loadMergedTheme(savedDraftTheme ?? savedPublishedTheme)
  );

  /**
   * Update a single theme key
   */
  function updateTheme(
    section: "colors" | "typography",
    key: string,
    value: string
  ) {
    setLocalDraftTheme((prev: any) => {
      const next = structuredClone(prev);

      if (!next[section]) next[section] = {};

      // Only allow canonical keys
      if (section === "colors") {
        if (!["primary", "secondary", "accent", "background", "foreground"].includes(key)) {
          return prev;
        }
      }

      if (section === "typography") {
        if (!["heading", "body"].includes(key)) {
          return prev;
        }
      }

      next[section][key] = value;
      return next;
    });
  }

  /**
   * Save Draft
   */
  async function saveDraft() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/themes/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_theme: localDraftTheme }),
      });

      if (!response.ok) throw new Error("Failed to save draft");

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
        draft_theme: null,
        published_theme: localDraftTheme,
      }),
    });

    if (!response.ok) throw new Error("Failed to publish");

    // Correct state transition
    setSavedPublishedTheme(localDraftTheme);
    setSavedDraftTheme(null);

    toast.success("Theme published");
  } catch {
    toast.error("Failed to publish theme");
  } finally {
    setLoading(false);
  }
}

  /**
   * Restore Defaults
   */
  async function restoreDefaults() {
    setLoading(true);

    const defaultDraft = loadMergedTheme(defaultTheme);

    try {
      const response = await fetch(`/api/admin/themes/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_theme: defaultDraft }),
      });

      if (!response.ok) throw new Error("Failed to restore defaults");

      setLocalDraftTheme(defaultDraft);
      setSavedDraftTheme(defaultDraft);
      toast.success("Default theme restored");
    } catch {
      toast.error("Failed to restore defaults");
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
    saveDraft,
    publishTheme,
    restoreDefaults,
  };
}
