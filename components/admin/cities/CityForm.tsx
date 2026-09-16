"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CityFormFields } from "./CityForm/CityFormFields";
import type { CityFormProps, CityFormValue } from "./CityForm/CityFormTypes";
import { createCityAction, updateCityAction } from "./actions";

export function CityForm({ mode, city, error }: CityFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<CityFormValue>({
    name: city?.name ?? "",
    slug: city?.slug ?? "",
    domain: city?.domain ?? "",
    status: city?.status ?? "draft",
    incorporated_year: city?.incorporated_year ?? null,
    description: city?.description ?? null,
    country: city?.country ?? "",
    state_province: city?.state_province ?? "",
    latitude: city?.latitude ?? null,
    longitude: city?.longitude ?? null,
    population: city?.population ?? null,
  });

  // Surface the redirected-back error once per navigation.
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  function handleCancel() {
    router.push("/admin/CEO/cities");
  }

  return (
    <form action={mode === "create" ? createCityAction : updateCityAction} className="space-y-6">
      {city?.id ? <input type="hidden" name="id" value={city.id} /> : null}

      <CityFormFields form={form} setForm={setForm} mode={mode} />

      <div className="flex items-center justify-end gap-3 mt-8">
        <Button variant="secondary" type="button" onClick={handleCancel}>
          Cancel
        </Button>

        <Button type="submit">
          {mode === "create" ? "Create City" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
