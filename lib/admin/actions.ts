"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTableConfig, type AdminTableName } from "@/lib/admin/config";
import { insertRow, removeRow, updateRow } from "@/lib/admin/data";
import { requireMinimumRole } from "@/lib/admin/auth";

function parseValue(type: string, value: FormDataEntryValue | null): unknown {
  if (value === null) {
    return null;
  }

  const stringValue = String(value).trim();

  if (stringValue === "") {
    return null;
  }

  switch (type) {
    case "number": {
      const parsed = Number(stringValue);
      return Number.isNaN(parsed) ? null : parsed;
    }
    case "boolean":
      return stringValue === "on" || stringValue === "true";
    case "json": {
      try {
        return JSON.parse(stringValue);
      } catch {
        throw new Error("Invalid JSON payload");
      }
    }
    case "date":
      return new Date(stringValue).toISOString();
    default:
      return stringValue;
  }
}

function formDataToRow(table: AdminTableName, formData: FormData) {
  const config = getTableConfig(table);
  const values: Record<string, unknown> = {};

  for (const field of config.fields) {
    if (field.readOnly) {
      continue;
    }

    const value = parseValue(field.type, formData.get(field.name));
    if (value !== null) {
      values[field.name] = value;
    }
  }

  return values;
}

export async function createRecordAction(table: AdminTableName, formData: FormData) {
  await requireMinimumRole("editor");
  const values = formDataToRow(table, formData);
  await insertRow(table, values);

  const route = getTableConfig(table).route;
  revalidatePath(route);
  redirect(route);
}

export async function updateRecordAction(table: AdminTableName, id: string, formData: FormData) {
  await requireMinimumRole("editor");
  const values = formDataToRow(table, formData);
  await updateRow(table, id, values);

  const route = getTableConfig(table).route;
  revalidatePath(route);
  redirect(route);
}

export async function deleteRecordAction(table: AdminTableName, id: string) {
  await requireMinimumRole("admin");
  await removeRow(table, id);

  const route = getTableConfig(table).route;
  revalidatePath(route);
  redirect(route);
}
