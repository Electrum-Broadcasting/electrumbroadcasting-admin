"use client";

type OverrideLogRow = {
  id: string;
  created_at: string;
  admin_id: string | null;
  action: string;
  target_type: "contributor" | "story";
  target_id: string;
};

interface RecentSafetyActivityProps {
  logs: OverrideLogRow[];
}

export function RecentSafetyActivity({ logs }: RecentSafetyActivityProps) {
  return (
    <section className="border rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold">Recent Safety Activity </h2>
      <div className="text-sm text-muted-foreground">
        Showing latest overrides and safety actions scoped to this city.
      </div>

      <div className="max-h-64 overflow-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">Admin</th>
              <th className="text-left px-3 py-2">Action</th>
              <th className="text-left px-3 py-2">Target</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-3 py-2">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">{log.admin_id || "Unknown"}</td>
                <td className="px-3 py-2">
                  {log.action} ({log.target_type})
                </td>
                <td className="px-3 py-2">{log.target_id}</td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td
                  className="px-3 py-4 text-center text-muted-foreground"
                  colSpan={4}
                >
                  No recent overrides for this city.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
