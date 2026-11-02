"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ContributorProfile = {
  id: string;
  display_name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  city_id: string | null;
  is_active: boolean | null;
};

export type ContributorCity = {
  id: string;
  name: string;
};

type FormState = {
  display_name: string;
  email: string;
  bio: string;
  avatar_url: string;
  city_id: string;
  is_active: boolean;
};

function initialState(profile: ContributorProfile | null): FormState {
  return {
    display_name: profile?.display_name ?? "",
    email: profile?.email ?? "",
    bio: profile?.bio ?? "",
    avatar_url: profile?.avatar_url ?? "",
    city_id: profile?.city_id ?? "",
    is_active: profile?.is_active ?? true,
  };
}

export function ContributorProfileEditor({
  profile,
  cities,
  onSaved,
  onCancel,
}: {
  profile: ContributorProfile | null;
  cities: ContributorCity[];
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(profile));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(initialState(profile));
  }, [profile]);

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("asset_type", "contributor_avatar");
      const response = await fetch("/api/admin/assets/upload", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(result?.error ?? "Avatar upload failed");
      }
      setForm((previous) => ({ ...previous, avatar_url: result.url }));
      toast.success("Contributor image uploaded");
    } catch (error) {
      console.error("Contributor avatar upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch(
        profile ? `/api/admin/contributors/${profile.id}` : "/api/admin/contributors",
        {
          method: profile ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            city_id: form.city_id || null,
            avatar_url: form.avatar_url || null,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || typeof result.contributor?.id !== "string") {
        throw new Error(result?.error ?? "Failed to save contributor");
      }
      toast.success(profile ? "Contributor profile saved" : "Contributor created");
      onSaved(result.contributor.id);
    } catch (error) {
      console.error("Contributor profile save failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save contributor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contributor-name">Display name</Label>
          <Input
            id="contributor-name"
            required
            maxLength={160}
            value={form.display_name}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, display_name: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contributor-email">Email</Label>
          <Input
            id="contributor-email"
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, email: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contributor-bio">Profile bio</Label>
        <textarea
          id="contributor-bio"
          maxLength={5000}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
          value={form.bio}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, bio: event.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contributor-city">Assigned city</Label>
        <select
          id="contributor-city"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.city_id}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, city_id: event.target.value }))
          }
        >
          <option value="">No city assigned</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {form.avatar_url ? (
          <img
            src={form.avatar_url}
            alt="Contributor profile preview"
            className="h-20 w-20 rounded-full border border-border object-cover"
          />
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="contributor-avatar">Profile image</Label>
          <Input
            id="contributor-avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(event) => void uploadAvatar(event.target.files?.[0])}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={form.is_active}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, is_active: event.target.checked }))
          }
        />
        Contributor active
      </label>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving…" : profile ? "Save profile" : "Create contributor"}
        </Button>
      </div>
    </form>
  );
}
