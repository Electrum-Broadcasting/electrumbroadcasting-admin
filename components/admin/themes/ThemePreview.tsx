export function ThemePreview({ theme }: { theme: any }) {
  const colors = theme.colors ?? {};
  const typography = theme.typography ?? {};

  return (
    <div
      className="rounded-lg border border-slate-200 p-6"
      style={{
        backgroundColor: colors.primary ?? "#000",
        color: colors.accent ?? "#fff",
        fontFamily: typography.body ?? "Inter",
      }}
    >
      <h2
        className="text-2xl font-bold mb-4"
        style={{ fontFamily: typography.heading ?? "Inter" }}
      >
        Theme Preview
      </h2>

      <p className="text-sm opacity-90">
        This is how your city’s theme will look across the platform.
      </p>
    </div>
  );
}
