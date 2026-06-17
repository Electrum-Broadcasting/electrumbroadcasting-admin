// lib/admin/types.ts

export type AdminRole =
  | "CEO"
  | "PLATFORM_ADMIN"
  | "CITY_ADMIN"
  | "EDITOR";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
  city_ids: string[];
  status: "active" | "inactive";
}

export interface AdminContext {
  userId: string;
  email: string | null;
  role: AdminRole;
  cityIds: string[];
}
