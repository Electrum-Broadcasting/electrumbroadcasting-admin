"use client";

import { useEffect } from "react";
import { loadMergedTheme } from "@/lib/themes/loadTheme";

type ThemeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ThemeRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const FONT_TO_GOOGLE_FAMILY: Record<string, string> = {
  Inter: "Inter:wght@400;500;600;700",
  Montserrat: "Montserrat:wght@400;500;600;700",
  Roboto: "Roboto:wght@400;500;700",
  Lato: "Lato:wght@400;700",
  Merriweather: "Merriweather:wght@400;700",
  "Source Sans Pro": "Source+Sans+Pro:wght@400;600;700",
};

function ensureFontLoaded(fontFamily: string) {
  const googleFamily = FONT_TO_GOOGLE_FAMILY[fontFamily];
  if (!googleFamily) {
    return;
  }

  const selector = `link[data-theme-preview-font="${fontFamily}"]`;
  const existing = document.querySelector<HTMLLinkElement>(selector);
  if (existing) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleFamily}&display=swap`;
  link.setAttribute("data-theme-preview-font", fontFamily);
  document.head.appendChild(link);
}

export function ThemePreview({
  draftTheme,
  publishedTheme,
  isEditing,
}: {
  draftTheme: unknown;
  publishedTheme: unknown;
  isEditing: boolean;
}) {
  const theme = loadMergedTheme(isEditing ? draftTheme : (publishedTheme ?? draftTheme));
  const colors = isRecord(theme.colors) ? theme.colors : theme;
  const typography = isRecord(theme.typography) ? theme.typography : {};
  const fontFamilies = isRecord(typography.families) ? typography.families : {};
  const selectedFontFamily =
    typeof typography.body === "string"
      ? typography.body
      : typeof fontFamilies.body === "string"
        ? fontFamilies.body
        : "Inter";
  const headingFontFamily =
    typeof typography.heading === "string"
      ? typography.heading
      : typeof fontFamilies.display === "string"
        ? fontFamilies.display
        : selectedFontFamily;
  const background =
    typeof colors.background === "string" ? colors.background : "#ffffff";
  const foreground =
    typeof colors.foreground === "string" ? colors.foreground : "#000000";
  const primary =
    typeof colors.primary === "string" ? colors.primary : "#000000";
  const secondary =
    typeof colors.secondary === "string" ? colors.secondary : foreground;
  const accent = typeof colors.accent === "string" ? colors.accent : "#fbbf24";

  useEffect(() => {
    ensureFontLoaded(selectedFontFamily);
    ensureFontLoaded(headingFontFamily);
  }, [headingFontFamily, selectedFontFamily]);

  return (
    <div
      className="rounded-lg border border-border bg-card p-6 shadow-sm"
      style={{
        backgroundColor: background,
        color: foreground,
        fontFamily: `"${selectedFontFamily}", sans-serif`,
      }}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide opacity-80">
        {isEditing ? "Live Draft Preview" : "Published Theme Preview"}
      </p>
      <h2
        className="mb-4 text-2xl font-bold"
        style={{
          color: primary,
          fontFamily: `"${headingFontFamily}", sans-serif`,
        }}
      >
        Theme Preview
      </h2>

      <p className="text-sm opacity-90" style={{ color: secondary }}>
        This is how your city’s theme will look across the platform.
      </p>

      <button
        type="button"
        className="mt-4 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        style={{ backgroundColor: accent, color: foreground }}
      >
        Sample CTA
      </button>
    </div>
  );
}
