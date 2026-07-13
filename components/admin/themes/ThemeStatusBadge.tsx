"use client";

function themesMatch(leftTheme: any, rightTheme: any) {
  return JSON.stringify(leftTheme ?? null) === JSON.stringify(rightTheme ?? null);
}

export function ThemeStatusBadge({
  draftTheme,
  publishedTheme,
}: {
  draftTheme: any;
  publishedTheme: any;
}) {
  const hasDraft = draftTheme !== null && draftTheme !== undefined;
  const hasPublished = publishedTheme !== null && publishedTheme !== undefined;

  const isPublished =
    hasPublished &&
    ( !hasDraft || themesMatch(draftTheme, publishedTheme) );

  const label =
    !hasDraft && !hasPublished
      ? "No theme"
      : isPublished
      ? "Published"
      : "Draft";

  const color =
    !hasDraft && !hasPublished
      ? "bg-gray-100 text-gray-800 border-gray-200"
      : isPublished
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";

  return (
    <span
      className={`inline-block rounded border px-2 py-1 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
