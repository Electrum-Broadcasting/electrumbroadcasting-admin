"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type CityFormState = {
  name: string;
  slug: string;
  domain: string;
  status: string;
  incorporated_year: number | null;
  description: string;
  country: string;
  state_province: string;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
};

export function CityForm({ mode, city }: { mode: "create" | "edit"; city?: any }) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [form, setForm] = useState<CityFormState>({
    name: city?.name ?? "",
    slug: city?.slug ?? "",
    domain: city?.domain ?? "",
    status: city?.status ?? "draft",
    incorporated_year: city?.incorporated_year ?? null,
    description: city?.description ?? "",
    country: city?.country ?? "",
    state_province: city?.state_province ?? "",
    latitude: city?.latitude ?? null,
    longitude: city?.longitude ?? null,
    population: city?.population ?? null,
  });
  const [loading, setLoading] = useState(false);

  function handleCancel() {
    router.push("/admin/CEO/cities");
  }

  async function handleSave() {
    if (loading) return;

    setLoading(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      domain: form.domain,
      status: form.status ?? "draft",
      incorporated_year: form.incorporated_year,
      electrum_year: form.incorporated_year,
      description: form.description || null,
      country: form.country || null,
      state_province: form.state_province || null,
      latitude: form.latitude,
      longitude: form.longitude,
      population: form.population,
    };

    const { error } = await supabase.rpc(
      mode === "create" ? "admin_create_city" : "admin_update_city",
      payload
    );

    setLoading(false);

    if (error) {
      toast.error("Failed to save city");
      return;
    }

    toast.success(mode === "create" ? "City created" : "City updated");

    router.push("/admin/CEO/cities");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Slug</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.slug}
          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Domain (optional)</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.domain}
          onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Status</label>
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.status}
          onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Incorporated Year</label>
        <input
          type="number"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.incorporated_year ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              incorporated_year: Number(e.target.value),
            }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Electrum Year</label>
        <input
          type="number"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.incorporated_year ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              incorporated_year: Number(e.target.value),
            }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Country</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.country}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, country: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">State / Province</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.state_province}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, state_province: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Latitude</label>
        <input
          type="number"
          step="0.000001"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.latitude ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              latitude: Number(e.target.value),
            }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Longitude</label>
        <input
          type="number"
          step="0.000001"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.longitude ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              longitude: Number(e.target.value),
            }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Population</label>
        <input
          type="number"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.population ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              population: Number(e.target.value),
            }))
          }
        />
      </div>

      <div className="flex items-center justify-end gap-3 mt-8">
        <Button variant="secondary" type="button" onClick={handleCancel}>
          Cancel
        </Button>

        <Button type="button" onClick={handleSave} disabled={loading}>
          {mode === "create" ? "Create City" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
