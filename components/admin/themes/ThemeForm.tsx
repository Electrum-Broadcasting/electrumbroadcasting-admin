"use client";

import { ThemeEditor } from "./ThemeEditor";

export function ThemeForm({
  city,
  draftTheme,
  publishedTheme,
}: {
  city: any;
  draftTheme: any;
  publishedTheme: any;
}) {
  return (
    <ThemeEditor
      city={city}
      draftTheme={draftTheme}
      publishedTheme={publishedTheme}
    />
  );
}
