"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CityFormFields } from "./CityForm/CityFormFields";
import type {
  CityFormPayload,
  CityFormProps,
  CityFormValue,
} from "./CityForm/CityFormTypes";
import { createCityAction, updateCityAction } from "./actions";

export function CityForm({ mode, city }: CityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<CityFormValue>({
    name: city?.name ?? "",
    slug: city?.slug ?? "",
    domain: city?.domain ?? "",
    status: city?.status ?? "draft",
    incorporated_year: city?.incorporated_year ?? null,
    description: city?.description ?? null,
    hero_image_url: city?.hero_image_url ?? null,
    country: city?.country ?? "",
    state_province: city?.state_province ?? "",
    latitude: city?.latitude ?? null,
    longitude: city?.longitude ?? null,
    population: city?.population ?? null,
  });

  function handleCancel() {
    router.push("/admin/CEO/cities");
  }

  async function handleSave() {
    if (loading) return;
    setLoading(true);

    const payload: CityFormPayload = {
      ...(city?.id ? { id: city.id } : {}),
      name: form.name ?? "",
      slug: form.slug ?? "",
      domain: form.domain ?? "",
      status: form.status ?? "draft",
      incorporated_year: form.incorporated_year ?? null,
      description: form.description ?? null,
      hero_image_url: form.hero_image_url ?? null,
      country: form.country ?? null,
      state_province: form.state_province ?? null,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      population: form.population ?? null,
    };

    

    const action = mode === "create" ? createCityAction : updateCityAction;
    const result = await action(payload);

    setLoading(false);

    if (result.error) {
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
      <CityFormFields form={form} setForm={setForm} mode={mode} />

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
