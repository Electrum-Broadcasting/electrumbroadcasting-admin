"use client";

import { useEffect, useState } from "react";

export default function BrandPreview({ cityId }: { cityId: string }) {
  const [palette, setPalette] = useState({
    accent_color: "#000000",
    accent_color_secondary: "#FFFFFF",
  });

  const [typography, setTypography] = useState({
    heading_font: "",
    body_font: "",
    scale_ratio: 1.25,
  });

  const [motion, setMotion] = useState({
    duration_short: 150,
    duration_medium: 300,
    duration_long: 600,
    easing: "ease-in-out",
  });

  const [accessibility, setAccessibility] = useState({
    high_contrast_mode: false,
    min_font_size: 14,
    prefers_reduced_motion: false,
    link_underline: true,
  });

  const [childSafety, setChildSafety] = useState({
    enable_age_filtering: false,
    hide_sensitive_images: true,
    restrict_video_autoplay: true,
    require_safe_search: true,
  });

  const [logo, setLogo] = useState({
    asset_id: "",
    alt_text: "",
    padding: 0,
    variant: "default",
  });

  // Load all brand settings
  useEffect(() => {
    async function loadAll() {
      const endpoints = [
        "palette",
        "typography",
        "motion",
        "accessibility",
        "child-safety",
        "logo",
      ];

      for (const section of endpoints) {
        const res = await fetch(
          `/api/admin/settings/brand/${section}?cityId=${cityId}`
        );
        const data = await res.json();

        if (section === "palette") setPalette(data);
        if (section === "typography") setTypography(data);
        if (section === "motion") setMotion(data);
        if (section === "accessibility") setAccessibility(data);
        if (section === "child-safety") setChildSafety(data);
        if (section === "logo") setLogo(data);
      }
    }

    loadAll();
  }, [cityId]);

  return (
    <div className="space-y-6 p-4 border rounded-md">
      <h2 className="text-lg font-semibold">Brand Preview</h2>

      {/* Logo */}
      <div className="flex items-center space-x-4">
        {logo.asset_id ? (
          <img
            src={`/api/admin/assets/${logo.asset_id}`}
            alt={logo.alt_text}
            style={{ padding: logo.padding }}
            className="h-20 w-auto"
          />
        ) : (
          <div className="text-sm text-gray-500">No logo uploaded</div>
        )}
      </div>

      {/* Typography */}
      <div>
        <h3
          style={{
            fontFamily: typography.heading_font,
            fontSize: `${typography.scale_ratio * 1.5}rem`,
          }}
        >
          Heading Preview
        </h3>
        <p
          style={{
            fontFamily: typography.body_font,
            fontSize: `${accessibility.min_font_size}px`,
          }}
        >
          Body text preview showing the selected font and minimum size.
        </p>
      </div>

      {/* Palette */}
      <div className="flex space-x-4">
        <div
          className="h-12 w-12 rounded"
          style={{ backgroundColor: palette.accent_color }}
        />
        <div
          className="h-12 w-12 rounded"
          style={{ backgroundColor: palette.accent_color_secondary }}
        />
      </div>

      {/* Motion */}
      <div>
        <div
          className="h-10 w-10 bg-blue-500 rounded animate-pulse"
          style={{
            animationDuration: `${motion.duration_medium}ms`,
            animationTimingFunction: motion.easing,
          }}
        ></div>
        <p className="text-sm text-gray-500">
          Motion preview using duration {motion.duration_medium}ms and easing{" "}
          {motion.easing}.
        </p>
      </div>

      {/* Accessibility */}
      <div className="text-sm">
        <p>
          High Contrast Mode:{" "}
          {accessibility.high_contrast_mode ? "Enabled" : "Disabled"}
        </p>
        <p>Minimum Font Size: {accessibility.min_font_size}px</p>
        <p>
          Reduced Motion:{" "}
          {accessibility.prefers_reduced_motion ? "Enabled" : "Disabled"}
        </p>
        <p>
          Underline Links:{" "}
          {accessibility.link_underline ? "Enabled" : "Disabled"}
        </p>
      </div>

      {/* Child Safety */}
      <div className="text-sm">
        <p>
          Age Filtering:{" "}
          {childSafety.enable_age_filtering ? "Enabled" : "Disabled"}
        </p>
        <p>
          Hide Sensitive Images:{" "}
          {childSafety.hide_sensitive_images ? "Enabled" : "Disabled"}
        </p>
        <p>
          Restrict Autoplay:{" "}
          {childSafety.restrict_video_autoplay ? "Enabled" : "Disabled"}
        </p>
        <p>
          Safe Search:{" "}
          {childSafety.require_safe_search ? "Enabled" : "Disabled"}
        </p>
      </div>
    </div>
  );
}