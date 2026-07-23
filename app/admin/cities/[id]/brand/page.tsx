"use client";

import BrandPaletteEditor from "./BrandPaletteEditor";
import BrandTypographyEditor from "./BrandTypographyEditor";
import BrandMotionEditor from "./BrandMotionEditor";
import BrandAccessibilityEditor from "./BrandAccessibilityEditor";
import BrandChildSafetyEditor from "./BrandChildSafetyEditor";
import BrandLogoUploader from "./BrandLogoUploader";
import BrandPreview from "./BrandPreview";

export default function CityBrandSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const cityId = params.id;

  return (
    <div className="space-y-10 p-6">
      <h1 className="text-2xl font-semibold">City Branding Settings</h1>

      {/* Preview */}
      <BrandPreview cityId={cityId} />

      {/* Editors */}
      <div className="space-y-8">
        <BrandPaletteEditor cityId={cityId} />
        <BrandTypographyEditor cityId={cityId} />
        <BrandMotionEditor cityId={cityId} />
        <BrandAccessibilityEditor cityId={cityId} />
        <BrandChildSafetyEditor cityId={cityId} />
        <BrandLogoUploader cityId={cityId} />
      </div>
    </div>
  );
}
