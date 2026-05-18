import Link from "next/link";
import type { AdminTableName } from "@/lib/admin/config";
import { deleteRecordAction } from "@/lib/admin/actions";
import { getTableConfig } from "@/lib/admin/config";

interface RecordsTableProps {
  table: AdminTableName;
  rows: Record<string, unknown>[];
  canEdit: boolean;
  canDelete: boolean;
}

export function RecordsTable({ table, rows, canEdit, canDelete }: RecordsTableProps) {
  const config = getTableConfig(table);
  const columns = config.fields.filter((field) => field.name !== "id").slice(0, 4);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">ID</th>
            {columns.map((column) => (
              <th key={column.name} className="px-4 py-3 text-left font-semibold text-slate-600">
                {column.label}
              </th>
            ))}
            {(canEdit || canDelete) ? (
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const id = String(row.id ?? "");
            return (
              <tr key={id}>
                <td className="max-w-[220px] truncate px-4 py-3 text-slate-700">{id}</td>
                {columns.map((column) => (
                  <td key={`${id}-${column.name}`} className="max-w-[220px] truncate px-4 py-3 text-slate-700">
                    {String(row[column.name] ?? "")}
                  </td>
                ))}
                {(canEdit || canDelete) ? (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {canEdit ? (
                        <Link
                          href={`${config.route}/${id}/edit`}
                          className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </Link>
                      ) : null}
                      {canDelete ? (
                        <form action={deleteRecordAction.bind(null, table, id)}>
                          <button
                            type="submit"
                            className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length + 2}>
                No records found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
