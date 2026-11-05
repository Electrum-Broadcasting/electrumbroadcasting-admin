"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import type { AdminRole } from "@/lib/admin/types";

export type AdminUserRow = {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole | string;
  city_ids: string[] | null;
  status: "active" | "inactive" | string;
  primary_city_slug: string | null;
};

export type CityRow = {
  id: string;
  name: string;
  slug: string | null;
};

type UserFormState = {
  email: string;
  role: AdminRole;
  city_ids: string[];
  status: "active" | "inactive";
  primary_city_slug: string;
};

const ROLE_OPTIONS: Array<{ value: AdminRole; label: string }> = [
  { value: "CITY_ADMIN", label: "City Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "PLATFORM_ADMIN", label: "Platform Admin" },
  { value: "CEO", label: "CEO" },
];

export function UserForm({
  mode,
  user,
  cities,
}: {
  mode: "create" | "edit";
  user?: AdminUserRow;
  cities: CityRow[];
}) {
  const router = useRouter();

  const [form, setForm] = useState<UserFormState>({
    email: user?.email ?? "",
    role: (user?.role as AdminRole | undefined) ?? "CITY_ADMIN",
    city_ids: user?.city_ids ?? [],
    status: user?.status === "inactive" ? "inactive" : "active",
    primary_city_slug: user?.primary_city_slug ?? "",
  });
  const [loading, setLoading] = useState(false);

  const selectedCities = cities.filter(
    (city) => form.city_ids.includes(city.id) && city.slug
  );

  function handleCancel() {
    router.push("/admin/CEO/users");
  }

  function handleCityToggle(cityId: string, checked: boolean) {
    setForm((prev) => {
      const nextCityIds = checked
        ? [...new Set([...prev.city_ids, cityId])]
        : prev.city_ids.filter((id) => id !== cityId);

      const primaryCityStillSelected = cities.some(
        (city) =>
          city.slug === prev.primary_city_slug && nextCityIds.includes(city.id)
      );

      return {
        ...prev,
        city_ids: nextCityIds,
        primary_city_slug: primaryCityStillSelected ? prev.primary_city_slug : "",
      };
    });
  }

  async function handleSave() {
    if (loading) return;

    setLoading(true);

    const primaryCity = cities.find((city) => city.slug === form.primary_city_slug);
    const normalizedCityIds = primaryCity && !form.city_ids.includes(primaryCity.id)
      ? [...form.city_ids, primaryCity.id]
      : form.city_ids;

    try {
      if (mode === "create") {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            role: form.role,
            city_ids: normalizedCityIds,
            status: form.status,
            primary_city_slug: form.primary_city_slug || null,
          }),
        });

        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          toast.error(result?.error ?? "Failed to create user");
          return;
        }
      } else {
        if (!user?.id) {
          toast.error("Missing user record");
          return;
        }

        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: form.role,
            city_ids: normalizedCityIds,
            status: form.status,
            primary_city_slug: form.primary_city_slug || null,
          }),
        });

        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        if (!response.ok) {
          toast.error(result?.error ?? "Failed to update user");
          return;
        }
      }

      toast.success(mode === "create" ? "User created" : "User updated");
      router.push("/admin/CEO/users");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
      className="space-y-6"
    >
      <CollapsibleSection title="Account" defaultOpen>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:bg-muted disabled:text-muted-foreground"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              disabled={mode === "edit"}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="admin-role">Role</label>
            <select
              id="admin-role"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  role: event.target.value as AdminRole,
                }))
              }
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="admin-status">Status</label>
            <select
              id="admin-status"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as "active" | "inactive",
                }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="City assignments">
        <div className="space-y-5">
          <fieldset>
            <legend className="text-sm font-medium">Assigned cities</legend>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cities.map((city) => (
                <label key={city.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={form.city_ids.includes(city.id)}
                    onChange={(event) => handleCityToggle(city.id, event.target.checked)}
                  />
                  {city.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="block text-sm font-medium" htmlFor="admin-primary-city">
              Primary city
            </label>
            <select
              id="admin-primary-city"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.primary_city_slug}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  primary_city_slug: event.target.value,
                }))
              }
            >
              <option value="">No primary city</option>
              {selectedCities.map((city) => (
                <option key={city.id} value={city.slug ?? ""}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSection>

      <div className="flex items-center justify-end gap-3 mt-8">
        <Button variant="secondary" type="button" onClick={handleCancel}>
          Cancel
        </Button>

        <Button type="submit" disabled={loading}>
          {mode === "create" ? "Create User" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}