"use client";

import { ThemeEditor } from "./ThemeEditor";

export function ThemeForm({
  city,
  draftTheme,
  publishedTheme,
  globalTheme,
}: {
  city: { id: string; name: string };
  draftTheme: unknown;
  publishedTheme: unknown;
  globalTheme: unknown;
}) {
  return (
    <ThemeEditor
      city={city}
      draftTheme={draftTheme}
      publishedTheme={publishedTheme}
      globalTheme={globalTheme}
    />
  );
}
