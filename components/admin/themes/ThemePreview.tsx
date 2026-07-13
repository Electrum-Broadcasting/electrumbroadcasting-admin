"use client";

import { useEffect } from "react";
import { loadMergedTheme } from "@/lib/themes/loadTheme";

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
  draftTheme: any;
  publishedTheme: any;
  isEditing: boolean;
}) {
  const theme = loadMergedTheme(isEditing ? draftTheme : (publishedTheme ?? draftTheme));
  const colors = theme.colors ?? {};
  const typography = theme.typography ?? {};
  const selectedFontFamily = typography.body ?? "Inter";
  const headingFontFamily = typography.heading ?? selectedFontFamily;

  useEffect(() => {
    ensureFontLoaded(selectedFontFamily);
    ensureFontLoaded(headingFontFamily);
  }, [headingFontFamily, selectedFontFamily]);

  return (
    <div
      className="rounded-lg border border-slate-200 p-6"
      style={{
        backgroundColor: colors.background ?? "#fff",
        color: colors.foreground ?? "#000",
        fontFamily: `"${selectedFontFamily}", sans-serif`,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80 mb-2">
        {isEditing ? "Live Draft Preview" : "Published Theme Preview"}
      </p>
      <h2
        className="text-2xl font-bold mb-4"
        style={{
          color: colors.primary ?? "#000",
          fontFamily: `"${headingFontFamily}", sans-serif`,
        }}
      >
        Theme Preview
      </h2>

      <p className="text-sm opacity-90" style={{ color: colors.secondary ?? "inherit" }}>
        This is how your city’s theme will look across the platform.
      </p>

      <button
        type="button"
        className="mt-4 rounded-md px-3 py-1.5 text-sm font-medium"
        style={{ backgroundColor: colors.accent ?? "#fbbf24", color: colors.foreground ?? "#000" }}
      >
        Sample CTA
      </button>
    </div>
  );
}
