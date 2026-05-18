import Link from "next/link";
import type { AdminTableName } from "@/lib/admin/config";
import type { AdminTableConfig } from "@/lib/admin/types";
import { getTableConfig } from "@/lib/admin/config";

interface RecordFormProps {
  table: AdminTableName;
  mode: "create" | "edit";
  action: (formData: FormData) => void;
  initialValues?: Record<string, unknown>;
}

function toFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  }
  return String(value);
}

export function RecordForm({ table, mode, action, initialValues = {} }: RecordFormProps) {
  const config = getTableConfig(table) as AdminTableConfig;

  return (
    <form action={action} className="space-y-4">
      {config.fields.map((field) => {
        const fieldValue = toFieldValue(initialValues[field.name]);

        if (field.readOnly && mode === "create") {
          return null;
        }

        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">
              {field.label}
            </label>
            {field.type === "textarea" || field.type === "json" ? (
              <textarea
                id={field.name}
                name={field.name}
                defaultValue={fieldValue}
                rows={field.type === "json" ? 6 : 4}
                readOnly={field.readOnly}
                required={field.required}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
              />
            ) : field.type === "boolean" ? (
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                defaultChecked={fieldValue === "true"}
                disabled={field.readOnly}
                className="h-4 w-4 rounded border-slate-300 text-accent"
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type === "number" ? "number" : field.type === "date" ? "datetime-local" : "text"}
                defaultValue={field.type === "date" && fieldValue ? fieldValue.slice(0, 16) : fieldValue}
                readOnly={field.readOnly}
                required={field.required}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none"
              />
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:opacity-90"
        >
          {mode === "create" ? "Create Record" : "Save Changes"}
        </button>
        <Link href={config.route} className="text-sm font-medium text-slate-600 hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
