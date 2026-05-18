import Link from "next/link";
import type { AdminTableName } from "@/lib/admin/config";
import { getTableConfig } from "@/lib/admin/config";

interface TableToolbarProps {
  table: AdminTableName;
  canCreate: boolean;
}

export function TableToolbar({ table, canCreate }: TableToolbarProps) {
  const config = getTableConfig(table);

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{config.label}</h2>
        <p className="text-sm text-slate-500">Manage records for the {config.key} table.</p>
      </div>
      {canCreate ? (
        <Link
          href={`${config.route}/new`}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Create {config.label.slice(0, -1)}
        </Link>
      ) : null}
    </div>
  );
}
