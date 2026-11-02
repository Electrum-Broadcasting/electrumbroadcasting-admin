---

# BRANDING_SCHEMA.md — Canonical Branding Specification (Public UI)**  
### *Version 1.0 — Lovable‑Aligned, City‑Scoped, Domain‑Driven*

---

## **1. Purpose**

This document defines the **canonical branding shape** used by the public UI of Electrum.  
Workspace must use this schema to normalize all branding across:

- Homepage  
- Timeline  
- Explore  
- Codex  
- Navigation  
- List pages  
- Metadata  
- Hero sections  
- Social links  
- Logos  
- Slideshow assets  
- Accessibility & child safety  

This schema applies **only** to the public UI.  
Admin UI editors may use additional fields.

Branding is **city‑specific** and stored in:

```
city_brand_settings
city_design_system.published_theme
global_brand_settings (fallback)
```

---

## **2. Canonical Branding Shape (TypeScript)**

```ts
export interface CityBranding {
  city_display_name: string;
  city_tagline: string | null;
  city_description: string | null;
  city_summary: string | null;

  // Homepage
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_text: string | null;
  hero_cta_link: string | null;
  homepage_tagline: string | null;
  homepage_subtitle: string | null;
  homepage_description: string | null;
  homepage_summary: string | null;
  slideshow_asset_ids: string[]; // uuid[]

  // Timeline
  timeline_title: string | null;
  timeline_description: string | null;
  timeline_og_title: string | null;
  timeline_og_description: string | null;
  timeline_canonical_url: string | null;

  // Navigation
  navigation_items_json: any[]; // structured nav items
  navigation_order_json: string[]; // ordering
  navigation_cta_text: string | null;
  navigation_cta_link: string | null;
  navigation_logo_asset_id: string | null;
  navigation_logo_alt_text: string | null;

  // Explore
  explore_title: string | null;
  explore_subtitle: string | null;
  explore_bento_items_json: any[];
  explore_shelf_items_json: any[];
  explore_description: string | null;
  explore_summary: string | null;

  // Codex
  codex_title: string | null;
  codex_subtitle: string | null;
  codex_description: string | null;
  codex_summary: string | null;

  // List Pages (Events, Entities, Places, Stories, Eras, Neighborhoods, Artifacts, Moments)
  list_page_title: string | null;
  list_page_description: string | null;
  list_page_og_title: string | null;
  list_page_og_description: string | null;
  list_page_canonical_url: string | null;

  // Social
  social_youtube: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_bluesky: string | null;

  // Logo
  logo: any; // JSON describing logo asset + alt text
  crest_asset_path: string | null;
  favicon_32_asset_path: string | null;
  favicon_48_asset_path: string | null;
  apple_touch_icon_asset_path: string | null;
  app_icon_512_asset_path: string | null;

  // Safety & Accessibility
  accessibility_json: any;
  child_safety_json: any;
}
```

This is the **only branding shape** public UI components should consume.

Brand image fields store object paths in the `universal-media` bucket, relative
to `cities/{city_id}/brand/`. `crest_asset_path` uses the square crest rule;
favicon paths use the documented 32×32, 48×48, 180×180, and 512×512 icon
dimensions. These paths are server-resolved and are never accepted from a URL
or client route parameter.

---

## **3. Canonical Supabase JSON Shape**

Branding is stored in:

```

`global_brand_settings.theme_json` holds the full Lovable theme and is the public
fallback. Public fallback reads are limited to `theme_json` and `logo_asset_id`.
`city_brand_settings` is content-only; theme tokens live in `city_design_system`
and `global_brand_settings` (see `THEME_SCHEMA.md`).
city_brand_settings
```

The JSON shape must follow:

```json
{
  "city_display_name": "string",
  "city_tagline": "string | null",
  "city_description": "string | null",
  "city_summary": "string | null",

  "hero_title": "string | null",
  "hero_subtitle": "string | null",
  "hero_cta_text": "string | null",
  "hero_cta_link": "string | null",
  "homepage_tagline": "string | null",
  "homepage_subtitle": "string | null",
  "homepage_description": "string | null",
  "homepage_summary": "string | null",
  "slideshow_asset_ids": ["uuid"],

  "timeline_title": "string | null",
  "timeline_description": "string | null",
  "timeline_og_title": "string | null",
  "timeline_og_description": "string | null",
  "timeline_canonical_url": "string | null",

  "navigation_items_json": [],
  "navigation_order_json": [],
  "navigation_cta_text": "string | null",
  "navigation_cta_link": "string | null",
  "navigation_logo_asset_id": "uuid | null",
  "navigation_logo_alt_text": "string | null",

  "explore_title": "string | null",
  "explore_subtitle": "string | null",
  "explore_bento_items_json": [],
  "explore_shelf_items_json": [],
  "explore_description": "string | null",
  "explore_summary": "string | null",

  "codex_title": "string | null",
  "codex_subtitle": "string | null",
  "codex_description": "string | null",
  "codex_summary": "string | null",

  "list_page_title": "string | null",
  "list_page_description": "string | null",
  "list_page_og_title": "string | null",
  "list_page_og_description": "string | null",
  "list_page_canonical_url": "string | null",

  "social_youtube": "string | null",
  "social_facebook": "string | null",
  "social_instagram": "string | null",
  "social_bluesky": "string | null",

  "logo": {},
  "crest_asset_path": "string | null",
  "favicon_32_asset_path": "string | null",
  "favicon_48_asset_path": "string | null",
  "apple_touch_icon_asset_path": "string | null",
  "app_icon_512_asset_path": "string | null",

  "accessibility_json": {},
  "child_safety_json": {}
}
```

---

## **4. Normalization Rules**

Workspace must normalize all branding usage in the public UI to the canonical shape.

### **Supabase Key → Public UI Key**

```
hero_title → branding.hero_title
hero_subtitle → branding.hero_subtitle
hero_cta_text → branding.hero_cta_text
hero_cta_link → branding.hero_cta_link

homepage_tagline → branding.homepage_tagline
homepage_subtitle → branding.homepage_subtitle
homepage_description → branding.homepage_description
homepage_summary → branding.homepage_summary
slideshow_asset_ids → branding.slideshow_asset_ids

timeline_title → branding.timeline_title
timeline_description → branding.timeline_description
timeline_og_title → branding.timeline_og_title
timeline_og_description → branding.timeline_og_description
timeline_canonical_url → branding.timeline_canonical_url

navigation_items_json → branding.navigation_items_json
navigation_order_json → branding.navigation_order_json
navigation_cta_text → branding.navigation_cta_text
navigation_cta_link → branding.navigation_cta_link
navigation_logo_asset_id → branding.navigation_logo_asset_id
navigation_logo_alt_text → branding.navigation_logo_alt_text

explore_title → branding.explore_title
explore_subtitle → branding.explore_subtitle
explore_bento_items_json → branding.explore_bento_items_json
explore_shelf_items_json → branding.explore_shelf_items_json
explore_description → branding.explore_description
explore_summary → branding.explore_summary

codex_title → branding.codex_title
codex_subtitle → branding.codex_subtitle
codex_description → branding.codex_description
codex_summary → branding.codex_summary

list_page_title → branding.list_page_title
list_page_description → branding.list_page_description
list_page_og_title → branding.list_page_og_title
list_page_og_description → branding.list_page_og_description
list_page_canonical_url → branding.list_page_canonical_url

social_youtube → branding.social_youtube
social_facebook → branding.social_facebook
social_instagram → branding.social_instagram
social_bluesky → branding.social_bluesky

logo → branding.logo

accessibility_json → branding.accessibility_json
child_safety_json → branding.child_safety_json
```

---

## **5. Deprecated Hardcoded Values (Remove Everywhere)**

Workspace must remove all hardcoded branding values, including:

- A city-specific brand name
- “A Living Timeline”  
- A city-specific Explore description
- “A cinematic journey through the people, places and moments…”  
- Any hardcoded CTA text  
- Any hardcoded hero text  
- Any hardcoded Explore/Codex titles  
- Any hardcoded navigation labels  
- Any hardcoded canonical URLs  
- Any hardcoded slideshow images  
- Any hardcoded social links  
- Any hardcoded logo paths  

These must be replaced with backend-driven branding.

---

## **6. Files Workspace Must Normalize**

Workspace must update branding usage in:

Workspace must normalize branding in all public UI route files.

Legacy frontend files previously contained hardcoded city branding; public branding must now be loaded from city settings.

---

## **7. Files Workspace Must Not Modify**

Workspace must not modify:

```
/electrumbroadcasting-admin/**
/electrumbroadcasting-city/src/lib/theme/**
/electrumbroadcasting-city/src/lib/sponsorship-model.ts
```

These contain admin logic, theme logic, or sponsorship logic.

---

## **8. Branding Usage Examples**

### **Homepage Hero**

```tsx
<h1>{branding.hero_title}</h1>
<p>{branding.hero_subtitle}</p>
<a href={branding.hero_cta_link}>{branding.hero_cta_text}</a>
```

### **Timeline Metadata**

```tsx
head: () => ({
  title: branding.timeline_og_title,
  meta: [
    { name: "description", content: branding.timeline_og_description },
    { property: "og:title", content: branding.timeline_og_title },
    { property: "og:description", content: branding.timeline_og_description }
  ]
})
```

### **Navigation**

```tsx
<Logo src={branding.navigation_logo_asset_id} alt={branding.navigation_logo_alt_text} />
<Nav items={branding.navigation_items_json} />
```

### **Explore Lander**

```tsx
<Bento items={branding.explore_bento_items_json} />
<Shelf items={branding.explore_shelf_items_json} />
```

---

## **9. Summary**

This schema defines:

- the canonical branding shape  
- the canonical Supabase JSON shape  
- the normalization rules  
- the deprecated hardcoded values  
- the directories to update  
- the directories to ignore  
- the usage patterns  

Workspace must use this document as the authoritative reference when normalizing branding across the public UI.

---
