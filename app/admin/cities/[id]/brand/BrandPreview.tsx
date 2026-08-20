"use client";

import { useEffect, useState } from "react";

type BrandState = {
  hero_image_url?: string;
  logo?: {
    url?: string;
    alt_text?: string;
    padding?: number;
    variant?: string;
  };
  description?: string;
  summary?: string;
  social_youtube?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_bluesky?: string;
  accessibility?: {
    high_contrast_mode?: boolean;
    min_font_size?: number;
    prefers_reduced_motion?: boolean;
    link_underline?: boolean;
  };
  child_safety?: {
    enable_age_filtering?: boolean;
    hide_sensitive_images?: boolean;
    restrict_video_autoplay?: boolean;
    require_safe_search?: boolean;
  };
};

type DesignSystem = {
  palette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    foreground?: string;
  };
  typography?: {
    heading?: string;
    body?: string;
  };
};

export default function BrandPreview({ cityId }: { cityId: string }) {
  const [brand, setBrand] = useState<BrandState>({});
  const [design, setDesign] = useState<DesignSystem>({});

  useEffect(() => {
    async function loadBrand() {
      const res = await fetch(`/api/admin/settings/brand?cityId=${cityId}`);
      const data = await res.json();
      setBrand(data || {});
    }

    async function loadDesignSystem() {
      const res = await fetch(`/api/admin/settings/design-system?cityId=${cityId}`);
      const data = await res.json();
      setDesign(data || {});
    }

    void loadBrand();
    void loadDesignSystem();
  }, [cityId]);

  const palette = design.palette || {};
  const typography = design.typography || {};

  return (
    <div className="space-y-6 p-4 border rounded-md">
      <h2 className="text-lg font-semibold">Brand Preview</h2>

      {/* Hero Image */}
      <div>
        {brand.hero_image_url ? (
          <img
            src={brand.hero_image_url}
            alt="Hero"
            className="w-full max-h-64 object-cover rounded"
          />
        ) : (
          <div className="text-sm text-gray-500">No hero image uploaded</div>
        )}
      </div>

      {/* Logo */}
      <div className="flex items-center space-x-4">
        {brand.logo?.url ? (
          <img
            src={brand.logo.url}
            alt={brand.logo.alt_text || "City Logo"}
            style={{ padding: brand.logo.padding ?? 0 }}
            className="h-20 w-auto"
          />
        ) : (
          <div className="text-sm text-gray-500">No logo uploaded</div>
        )}
      </div>

      {/* Typography Preview */}
      <div>
        <h3
          style={{
            fontFamily: typography.heading || "inherit",
            fontSize: "1.75rem",
            color: palette.foreground || "#111827",
          }}
        >
          Heading Preview
        </h3>
        <p
          style={{
            fontFamily: typography.body || "inherit",
            fontSize: "16px",
            color: palette.foreground || "#111827",
          }}
        >
          Body text preview showing the active city theme and typography.
        </p>
      </div>

      {/* Palette Preview */}
      <div className="flex space-x-4">
        <div className="h-12 w-12 rounded border" style={{ backgroundColor: palette.primary }} />
        <div className="h-12 w-12 rounded border" style={{ backgroundColor: palette.secondary }} />
        <div className="h-12 w-12 rounded border" style={{ backgroundColor: palette.accent }} />
        <div className="h-12 w-12 rounded border" style={{ backgroundColor: palette.background }} />
      </div>

      {/* Brand Content */}
      <div className="text-sm text-gray-700 space-y-2">
        {brand.description && <p><strong>Description:</strong> {brand.description}</p>}
        {brand.summary && <p><strong>Summary:</strong> {brand.summary}</p>}
      </div>

      {/* Social Links */}
      <div className="text-sm text-gray-700 space-y-1">
        {brand.social_youtube && <p>YouTube: {brand.social_youtube}</p>}
        {brand.social_facebook && <p>Facebook: {brand.social_facebook}</p>}
        {brand.social_instagram && <p>Instagram: {brand.social_instagram}</p>}
        {brand.social_bluesky && <p>Bluesky: {brand.social_bluesky}</p>}
      </div>

      {/* Accessibility Indicators */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>High Contrast Mode: {brand.accessibility?.high_contrast_mode ? "Enabled" : "Disabled"}</p>
        <p>Minimum Font Size: {brand.accessibility?.min_font_size ?? 14}px</p>
        <p>Reduced Motion: {brand.accessibility?.prefers_reduced_motion ? "Enabled" : "Disabled"}</p>
        <p>Underline Links: {brand.accessibility?.link_underline ? "Enabled" : "Disabled"}</p>
      </div>

      {/* Child Safety Indicators */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>Age Filtering: {brand.child_safety?.enable_age_filtering ? "Enabled" : "Disabled"}</p>
        <p>Hide Sensitive Images: {brand.child_safety?.hide_sensitive_images ? "Enabled" : "Disabled"}</p>
        <p>Restrict Autoplay: {brand.child_safety?.restrict_video_autoplay ? "Enabled" : "Disabled"}</p>
        <p>Safe Search: {brand.child_safety?.require_safe_search ? "Enabled" : "Disabled"}</p>
      </div>
    </div>
  );
}
