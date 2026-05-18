export type AdminRole = "admin" | "editor" | "viewer";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "date" | "json";

export interface AdminField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
}

export interface AdminTableConfig {
  key: string;
  label: string;
  route: string;
  fields: AdminField[];
  titleField: string;
}
