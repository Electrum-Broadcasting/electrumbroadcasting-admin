export const runtime = "nodejs";

import "./globals.css";
import type { CSSProperties, ReactNode } from "react";

import { getBrandSettings } from "../lib/settings/getBrandSettings";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const brand = await getBrandSettings();

  // Extract tokens safely
  const neutrals = brand.neutral_palette_json ?? {};
  const typography = brand.typography_json ?? {};
  const motion = brand.motion_settings_json ?? {};
  const iconography = brand.iconography_json ?? {};

  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            /* Brand Colors */
            --primary: ${brand.primary_color};
            --secondary: ${brand.secondary_color};
            --background: ${brand.background_color ?? "#ffffff"};
            --foreground: ${brand.foreground_color ?? "#000000"};

            /* Neutral Palette */
            --neutral-50: ${neutrals["50"] ?? "#fafafa"};
            --neutral-100: ${neutrals["100"] ?? "#f5f5f5"};
            --neutral-200: ${neutrals["200"] ?? "#e5e5e5"};
            --neutral-300: ${neutrals["300"] ?? "#d4d4d4"};
            --neutral-400: ${neutrals["400"] ?? "#a3a3a3"};
            --neutral-500: ${neutrals["500"] ?? "#737373"};
            --neutral-600: ${neutrals["600"] ?? "#525252"};
            --neutral-700: ${neutrals["700"] ?? "#404040"};
            --neutral-800: ${neutrals["800"] ?? "#262626"};
            --neutral-900: ${neutrals["900"] ?? "#171717"};

            /* Typography */
            --font-body: ${typography.body_font ?? "Inter"};
            --font-heading: ${typography.heading_font ?? "Inter"};
            --font-size-sm: ${typography.sizes?.sm ?? "14px"};
            --font-size-md: ${typography.sizes?.md ?? "16px"};
            --font-size-lg: ${typography.sizes?.lg ?? "18px"};
            --font-size-xl: ${typography.sizes?.xl ?? "24px"};
            --font-size-2xl: ${typography.sizes?.["2xl"] ?? "32px"};

            /* Motion */
            --motion-fast: ${motion.duration?.fast ?? 150}ms;
            --motion-normal: ${motion.duration?.normal ?? 250}ms;
            --motion-slow: ${motion.duration?.slow ?? 400}ms;

            --motion-ease-in: ${motion.easing?.in ?? "cubic-bezier(0.4, 0, 1, 1)"};
            --motion-ease-out: ${motion.easing?.out ?? "cubic-bezier(0, 0, 0.2, 1)"};
            --motion-ease-in-out: ${motion.easing?.inOut ?? "cubic-bezier(0.4, 0, 0.2, 1)"};

            /* Iconography */
            --icon-style: ${iconography.style ?? "outline"};

            /* Dark Mode */
            ${brand.dark_mode_enabled ? `
              --background: ${brand.dark_background_color ?? "#0f0f0f"};
              --foreground: ${brand.dark_foreground_color ?? "#ffffff"};
            ` : ""}
          }

          body {
            background-color: var(--background);
            color: var(--foreground);
            font-family: var(--font-body), sans-serif;
          }
        `}</style>
      </head>

      <body>
        {children}
      </body>
    </html>
  );
}