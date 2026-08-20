"use client";

import { useState, useEffect, SetStateAction } from "react";
import { useRouter } from "next/navigation";

import BrandHeroUploader from "./BrandHeroUploader";
import BrandAccessibilityEditor from "./BrandAccessibilityEditor";
import BrandChildSafetyEditor from "./BrandChildSafetyEditor";
import BrandLogoUploader from "./BrandLogoUploader";
import BrandPreview from "./BrandPreview";

import { BrandContentFields } from "./BrandContentFields";
import { BrandHeroFields } from "./BrandHeroFields";
import { BrandJsonFields } from "./BrandJsonFields";
import { BrandSocialFields } from "./BrandSocialFields";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CityBrandSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const cityId = params.id;
  const router = useRouter();

  // Unified brand state
  const [state, setState] = useState<any>({});

  // Load existing brand settings
  useEffect(() => {
    async function loadBrand() {
      const res = await fetch(`/api/admin/settings/brand?cityId=${cityId}`);
      const data = await res.json();
      if (data) setState(data);
    }
    loadBrand();
  }, [cityId]);

  // Save button handler
  async function handleSave() {
    try {
      const res = await fetch("/api/admin/settings/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId,
          ...state,
        }),
      });

      if (!res.ok) {
        toast.error("Error saving brand settings");
        return;
      }

      toast.success("Brand settings saved");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    }
  }

  return (
    <div className="space-y-10 p-6">
      <h1 className="text-2xl font-semibold">City Branding Settings</h1>

      {/* Preview */}
      <BrandPreview cityId={cityId} />

      <div className="space-y-8">
        {/* Uploaders */}
        <BrandLogoUploader cityId={cityId} state={state} setState={setState} />
        <BrandHeroUploader cityId={cityId} state={{
          hero: undefined
        }} setState={function (value: SetStateAction<{ [key: string]: unknown; hero?: { hero_image_url?: string; hero_image_path?: string; }; }>): void {
          throw new Error("Function not implemented.");
        } } />

        {/* Editors */}
        <BrandHeroFields state={state} setState={setState} />
        <BrandContentFields state={state} setState={setState} />
        <BrandSocialFields state={state} setState={setState} />

        {/* JSON editors */}
        <BrandJsonFields state={state} setState={setState} />

        {/* Accessibility + Child Safety */}
        <BrandAccessibilityEditor
          cityId={cityId} state={{
            accessibility: undefined
          }} setState={function (value: SetStateAction<{ [key: string]: unknown; accessibility?: { high_contrast_mode?: boolean; min_font_size?: number; prefers_reduced_motion?: boolean; link_underline?: boolean; }; }>): void {
            throw new Error("Function not implemented.");
          } }        />
          
          <BrandChildSafetyEditor
          cityId={cityId} state={{
            child_safety: undefined
          }} setState={function (value: SetStateAction<{ [key: string]: unknown; child_safety?: { enable_age_filtering?: boolean; hide_sensitive_images?: boolean; restrict_video_autoplay?: boolean; require_safe_search?: boolean; }; }>): void {
            throw new Error("Function not implemented.");
          } }          />
        

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          Save Brand Settings
        </Button>
      </div>
    </div>
  );
}
