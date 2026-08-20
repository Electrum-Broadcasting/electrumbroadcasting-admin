import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";

import { createBrowserClient } from "@/lib/supabase/client";
import type { CityFormValue, CityStatus } from "./CityFormTypes";



const parseNullableNumber = (value: string) => {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

type CityFormFieldsProps = {
  form: CityFormValue;
  setForm: Dispatch<SetStateAction<CityFormValue>>;
  mode: "create" | "edit";
};

export function CityFormFields({ form, setForm, mode }: CityFormFieldsProps) {
  void mode;

  const supabase = createBrowserClient();
  const [uploading, setUploading] = useState(false);
  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]);

  const setValue = <K extends keyof CityFormValue>(
    field: K,
    value: CityFormValue[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const watch = <K extends keyof CityFormValue>(field: K) => form[field];

  const handleHeroImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      if (!allowedMimeTypes.has(file.type)) {
        alert("Only JPEG, JPG, PNG, and WebP image files are allowed.");
        e.target.value = "";
        return;
      }

      const slug = form.slug || "city";
      const extension = file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
      const filePath = `cities/${slug}/hero-${Date.now()}.${extension}`;

      const { error } = await supabase.storage
        .from("universal-media")
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error(error);
        alert("Upload failed.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("universal-media")
        .getPublicUrl(filePath);

      setValue("hero_image_url", publicUrlData.publicUrl);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.name ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Slug</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.slug ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Domain (optional)</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.domain ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
        />
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
              incorporated_year: parseNullableNumber(e.target.value),
            }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Hero Image</label>

        {watch("hero_image_url") && (
          <img
            src={watch("hero_image_url") ?? ""}
            alt="City hero"
            className="mt-2 h-40 w-full rounded-md border border-slate-300 object-cover"
          />
        )}

        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
          disabled={uploading}
          onChange={handleHeroImageUpload}
        />

        {uploading && (
          <p className="mt-1 text-sm text-slate-500">Uploading image...</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Country</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.country ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">State / Province</label>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.state_province ?? ""}
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
              latitude: parseNullableNumber(e.target.value),
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
              longitude: parseNullableNumber(e.target.value),
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
              population: parseNullableNumber(e.target.value),
            }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Status</label>
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          value={form.status ?? "draft"}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, status: e.target.value as CityStatus }))
          }
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
    </>
  );
}
