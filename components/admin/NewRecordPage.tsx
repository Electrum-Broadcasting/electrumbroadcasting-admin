import type { AdminTableName } from "@/lib/admin/config";
import { RecordForm } from "@/components/admin/RecordForm";
import { createRecordAction } from "@/lib/admin/actions";
import { getTableConfig } from "@/lib/admin/config";

interface NewRecordPageProps {
  table: AdminTableName;
}

export function NewRecordPage({ table }: NewRecordPageProps) {
  const config = getTableConfig(table);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-2xl font-semibold text-ink">Create {config.label.slice(0, -1)}</h2>
      <p className="mb-6 text-sm text-slate-500">Create a new record in the {config.key} table.</p>
      <RecordForm table={table} mode="create" action={createRecordAction.bind(null, table)} />
    </div>
  );
}
