import { notFound } from "next/navigation";
import type { AdminTableName } from "@/lib/admin/config";
import { RecordForm } from "@/components/admin/RecordForm";
import { updateRecordAction } from "@/lib/admin/actions";
import { getRowById } from "@/lib/admin/data";
import { getTableConfig } from "@/lib/admin/config";

interface EditRecordPageProps {
  table: AdminTableName;
  id: string;
}

export async function EditRecordPage({ table, id }: EditRecordPageProps) {
  const config = getTableConfig(table);
  const row = await getRowById(table, id);

  if (!row) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-2xl font-semibold text-ink">Edit {config.label.slice(0, -1)}</h2>
      <p className="mb-6 text-sm text-slate-500">Update record {id} in {config.key}.</p>
      <RecordForm table={table} mode="edit" action={updateRecordAction.bind(null, table, id)} initialValues={row} />
    </div>
  );
}
