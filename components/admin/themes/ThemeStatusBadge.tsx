"use client";

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function ThemeStatusBadge({
  draftTheme,
  publishedTheme,
}: {
  draftTheme: unknown;
  publishedTheme: unknown;
}) {
  const hasDraft = draftTheme !== null && draftTheme !== undefined;
  const hasPublished = publishedTheme !== null && publishedTheme !== undefined;

  const isPublished =
    hasPublished &&
    (!hasDraft || stableSerialize(draftTheme) === stableSerialize(publishedTheme));

  const label =
    !hasDraft && !hasPublished
      ? "No theme"
      : isPublished
      ? "Published"
      : "Draft";

  const color = !hasDraft && !hasPublished
    ? "bg-muted text-muted-foreground"
    : isPublished
      ? "bg-primary/10 text-primary"
      : "bg-accent/30 text-accent-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
