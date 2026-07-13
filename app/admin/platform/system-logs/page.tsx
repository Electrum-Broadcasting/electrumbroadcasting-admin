// /app/admin/platform/system-logs/page.tsx

import Link from "next/link";
import { headers } from "next/headers";

async function getSystemLogs() {
  try {
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const url = `${protocol}://${host}/api/system-logs`;

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("System Logs API returned:", res.status);
      return [];
    }

    const json = await res.json();
    return Array.isArray(json?.logs) ? json.logs : [];
  } catch (err) {
    console.error("Failed to load system logs:", err);
    return [];
  }
}

export default async function SystemLogsPage() {
  const logs = await getSystemLogs();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">System Logs</h1>

      <p className="text-sm text-gray-600 mb-6">
        These logs reflect platform-level events such as admin actions, system
        operations, and background tasks.
      </p>

      {logs.length === 0 && (
        <div className="text-gray-500 text-sm">
          No system logs found.
        </div>
      )}

      <ul className="space-y-3">
        {logs.map((log: any) => (
          <li
            key={log.id}
            className="border rounded p-3 text-sm flex flex-col gap-1"
          >
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-1 rounded text-xs font-semibold"
                style={{
                  backgroundColor:
                    log.severity === "error"
                      ? "#fee2e2"
                      : log.severity === "warning"
                      ? "#fef9c3"
                      : "#e5e7eb",
                  color:
                    log.severity === "error"
                      ? "#b91c1c"
                      : log.severity === "warning"
                      ? "#92400e"
                      : "#374151",
                }}
              >
                {log.severity}
              </span>

              <span className="font-medium">{log.event_type}</span>
            </div>

            <div className="text-gray-600">
              {log.message || "No message provided"}
            </div>

            <div className="text-xs text-gray-400">
              {new Date(log.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link href="/admin" className="text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
