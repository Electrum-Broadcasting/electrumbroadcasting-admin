export function ThemeStatusBadge({ status }: { status: string }) {
  const color =
    status === "published"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded border ${color}`}
    >
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}
