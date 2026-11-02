"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import { ThemeEditor } from "@/components/admin/themes/ThemeEditor";
import type { ThemePersistence } from "@/components/admin/themes/ThemeState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ThemeRow = {
  id: string;
  status: "draft" | "published";
  theme_json: unknown;
  logo_asset_id: string | null;
};

type BrandSettingsResponse = {
  draft: ThemeRow | null;
  published: ThemeRow | null;
};

async function saveBrandAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/settings/brand", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error ?? "Failed to save global brand settings");
  }
}

export default function BrandSettingsSection() {
  const [brand, setBrand] = useState<BrandSettingsResponse | null>(null);
  const [draftLogoAssetId, setDraftLogoAssetId] = useState("");
  const [publishedLogoAssetId, setPublishedLogoAssetId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingLogo, setSavingLogo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/settings/brand", {
          cache: "no-store",
          credentials: "include",
        });
        const result = (await response.json()) as BrandSettingsResponse & {
          error?: string;
        };
        if (!response.ok) throw new Error(result.error ?? "Failed to load global brand settings");
        if (!result.draft || !result.published) {
          throw new Error(
            "Global brand draft and published rows are required. No rows were created."
          );
        }
        if (active) {
          setBrand(result);
          setDraftLogoAssetId(result.draft.logo_asset_id ?? "");
          setPublishedLogoAssetId(result.published.logo_asset_id ?? "");
        }
      } catch (loadError) {
        console.error("Failed to load global brand settings:", loadError);
        if (active) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load global brand settings";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const persistence = useMemo<ThemePersistence>(
    () => ({
      saveDraft: (theme) =>
        saveBrandAction({ action: "save_draft", theme_json: theme }),
      publishTheme: (theme) =>
        saveBrandAction({
          action: "publish",
          theme_json: theme,
          logo_asset_id: draftLogoAssetId || null,
        }),
    }),
    [draftLogoAssetId]
  );

  const uploadLogo = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("asset_type", "logo");
    try {
      const response = await fetch("/api/admin/assets/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || typeof result.asset_id !== "string") {
        throw new Error(result?.error ?? "Logo upload failed");
      }
      setDraftLogoAssetId(result.asset_id);
      toast.success("Logo uploaded. Save the draft to retain it.");
    } catch (uploadError) {
      console.error("Failed to upload global brand logo:", uploadError);
      toast.error(uploadError instanceof Error ? uploadError.message : "Logo upload failed");
    }
  }, []);

  async function saveLogo() {
    setSavingLogo(true);
    try {
      await saveBrandAction({
        action: "save_logo",
        logo_asset_id: draftLogoAssetId || null,
      });
      toast.success("Draft logo saved");
    } catch (saveError) {
      console.error("Failed to save global brand logo:", saveError);
      toast.error(saveError instanceof Error ? saveError.message : "Failed to save logo");
    } finally {
      setSavingLogo(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading global brand settings…</p>;
  }
  if (error || !brand?.draft || !brand.published) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error || "Global brand settings are unavailable."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CollapsibleSection
        title="Global brand assets"
        description="The global logo is stored separately from the theme JSON."
        defaultOpen
      >
        <div className="space-y-4">
          {draftLogoAssetId ? (
            <img
              src={`/api/assets/${draftLogoAssetId}`}
              alt="Global brand draft logo"
              className="h-20 max-w-56 rounded-md border border-border bg-background p-2 object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No draft logo selected.</p>
          )}
          {publishedLogoAssetId ? (
            <p className="text-xs text-muted-foreground">
              Published logo asset: {publishedLogoAssetId}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="global-brand-logo">Upload or replace global logo</Label>
            <Input
              id="global-brand-logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => void uploadLogo(event.target.files?.[0])}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => void saveLogo()}
              disabled={savingLogo}
            >
              {savingLogo ? "Saving…" : "Save logo draft"}
            </Button>
          </div>
        </div>
      </CollapsibleSection>

      <ThemeEditor
        city={{ id: "global", name: "Global brand" }}
        subjectLabel="global theme"
        draftTheme={brand.draft.theme_json}
        publishedTheme={brand.published.theme_json}
        globalTheme={brand.published.theme_json}
        persistence={persistence}
      />
    </div>
  );
}
