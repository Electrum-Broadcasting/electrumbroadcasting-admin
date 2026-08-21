THEME_SCHEMA.md — Canonical Theme Specification (Public UI)
1. Purpose
This document defines the canonical theme shape used by the public UI of Electrum. Workspace should use this schema to normalize theme usage across all public facing components.
This schema does not apply to the Admin UI, design system editors, or brand settings editors.
2. Canonical Theme Shape (TypeScript)
ts
export interface CityTheme {
  foreground: string;
  background: string;
  accent: string;
  typography: {
    heading: string;
    body: string;
  };
  colors: {
    buttonText: string;
  };
}
This is the only theme shape that public UI components should consume.
3. Canonical Supabase JSON Shape
The city_design_system.published_theme JSON must follow this structure:
json
{
  "colors": {
    "accent": "string",
    "background": "string",
    "foreground": "string",
    "primary": "string",
    "secondary": "string",
    "buttonText": "string"
  },
  "typography": {
    "heading": "string",
    "body": "string"
  }
}
Only the following keys are used by the public UI:
•	colors.accent
•	colors.background
•	colors.foreground
•	colors.buttonText
•	typography.heading
•	typography.body
The remaining keys (primary, secondary) are reserved for future use.
4. Normalization Rules
Workspace must normalize all theme usage in the public UI to the canonical shape:
Supabase JSON Key	Public UI Key
colors.accent	theme.accent
colors.background	theme.background
colors.foreground	theme.foreground
colors.buttonText	theme.colors.buttonText
typography.heading	theme.typography.heading
typography.body	theme.typography.body
5. Deprecated Keys (Remove Everywhere)
Workspace must remove all references to these keys in the public UI:
•	primary_color
•	secondary_color
•	accent_color
•	text_color
•	heading_font
•	body_font
•	nav_style
•	font_family
•	published_theme (raw usage)
•	draft_theme (raw usage)
These belong to the old ThemeProvider pipeline and must not appear in public UI code.
6. Files Workspace Should Delete
Workspace should delete these obsolete files if present:
•	electrum-ui/theme/mergeTheme.ts
•	electrum-ui/theme/mergeBranding.ts
•	electrum-ui/theme/mapThemeToTokens.ts
•	electrum-ui/theme/mapGlobalBrandToTheme.ts
•	electrum-ui/styles/cityThemes.ts
•	electrum-ui/lib/getCityTheme.ts
•	electrum-ui/lib/loadCity.client.ts ← safe to delete
These files belong to the old theme architecture and must not be used.
7. Directories Workspace Should Normalize
Workspace should update theme usage only in these public UI directories:
•	/electrum-ui/app/[citySlug]/**
•	/electrum-ui/components/city/**
•	/electrum-ui/components/public/**
•	/electrum-ui/components/NavBar/**
•	/electrum-ui/lib/public/**
These directories contain public facing components that must use the canonical theme shape.
8. Directories Workspace Must NOT Modify
Workspace must not modify any files in:
•	/electrum-ui/app/admin/**
•	/electrum-ui/app/(admin)/**
•	/electrum-ui/components/admin/**
•	/electrum-ui/integrations/supabase/admin/**
•	/electrum-ui/app/design-system/**
•	/electrum-ui/app/brand-settings/**
•	/electrum-ui/app/global-brand-settings/**
•	/electrum-ui/dashboard/**
These directories contain Admin UI, editors, or design system tooling that intentionally use different theme shapes.
9. Public UI Theme Usage Examples
CSS Variables
ts
const themeVars = {
  "--accent": theme.accent,
  "--accent-secondary": theme.foreground,
  "--font-heading": theme.typography.heading,
  "--font-body": theme.typography.body,
  "--hero-bg": theme.background,
  "--hero-fg": theme.foreground,
  "--button-text": theme.colors.buttonText ?? theme.foreground
};
Component Usage
tsx
style={{ color: "var(--accent)" }}
style={{ backgroundColor: "var(--accent)" }}
style={{ fontFamily: "var(--font-heading)" }}
Workspace should ensure all public UI components follow this pattern.
10. Summary
This schema defines:
•	the canonical theme shape
•	the canonical JSON shape
•	the normalization rules
•	the deprecated keys
•	the files to delete
•	the directories to update
•	the directories to ignore
Workspace should use this document as the authoritative reference when normalizing theme usage across the public UI.

