# Theme Schema (Lovable design tokens)

The catalog module `lovable-theme.ts` (`src/lib/` in the city repo, `lib/` in the admin repo; the two copies must stay identical) is the single source of truth. Validation, CSS injection, seed data and Admin form fields are all derived from it.

## Storage

| Column | Contents |
| --- | --- |
| `global_brand_settings.theme_json` | Full Lovable theme. Global fallback. |
| `city_design_system.draft_theme` | Same shape. Edited in Admin. |
| `city_design_system.published_theme` | Same shape. Read by the public UI. |

`global_brand_settings.logo_asset_id` holds the Electrum logo. The city logo override lives outside the theme. `city_brand_settings` is content-only and never holds theme tokens.

## Stored shape (flat color keys, snake_case)

- Semantic: `background`, `foreground`, `primary`, `primary_foreground`, `secondary`, `secondary_foreground`, `accent`, `accent_foreground`, `destructive`, `destructive_foreground`
- Neutral: `ink`, `gold`, `gold_glow`, `card`, `card_foreground`, `popover`, `popover_foreground`, `muted`, `muted_foreground`, `header_solid`, `museum_warm`
- Utility: `border`, `input`, `ring`
- Charts: `chart_1` … `chart_5`
- Sidebar: `sidebar`, `sidebar_foreground`, `sidebar_primary`, `sidebar_primary_foreground`, `sidebar_accent`, `sidebar_accent_foreground`, `sidebar_border`, `sidebar_ring`
- Radii: `radius_base` (canonical, editable), `radius_round`, `radius_search_input` (stored, hidden in Admin)
- Shadows (optional): `shadow_museum_tile`, `shadow_search_input`
- `typography`: `families.{display,body,serif}`, `loaded_weights`, and style blocks `body`, `home_hero_h1_1280`, `home_h2`, `explore_h1`, `explore_tagline`, `header_brand`, `header_nav`, `header_global_nav`, `search_input_large`
- `motion`: `header_background`, `nav_link_hover`, `hotspot_ping`, `search_pulse`, `story_image_hover`, `reduced_motion`, `panorama_auto_rotate_deg_per_sec`, `panorama_pitch_limit_deg`
- `iconography` (null by default), `crest_asset_url` and `favicon_asset_url` (null, not yet wired into the public UI)
- `dark`: dark overrides. Empty by default and hidden in Admin. The stock shadcn `.dark` block is not used.

Colors are OKLCH strings, stored verbatim in the Lovable JSON percent notation (for example `oklch(13% .02 240)`). There is no `radius` key.

## Derived in code (never stored)

- `--color-*` aliases for every color token, plus `--color-ring-offset-background`
- `--radius` and `--radius-sm` … `--radius-4xl` from `radius_base` (offsets -4, -2, 0, +4, +8, +12, +16px)
- Typography (`--type-*`) and motion (`--motion-*`) variables
- Dark-mode aliases

## Loading (city repo)

`normalizeTheme()` and `loadCityPresentation()` in `src/lib/theme.ts` read `published_theme` for the city and fall back to `global_brand_settings.theme_json`. Values that fail validation (non-OKLCH colors, unsafe CSS, Workspace-shaped themes) are rejected.

`CityProviders` injects the variables with `themeToCss()` under `.city-theme-scope`.

## Admin

The Admin chrome stays on shadcn. The CEO global editor, the CEO per-city editor and the City Admin editor share `LovableThemeFields`, generated from the catalog.

## Editable Fields (Admin + CEO)
The following fields are editable in Admin and CEO theme editors:

semantic colors

neutral colors

utility colors

chart colors

sidebar colors

radius_base

typography families

typography style blocks

motion tokens

crest_asset_url

favicon_asset_url

iconography (when supported)

## Hidden Fields (Stored but not editable)
The following fields are stored in the theme JSON but intentionally hidden in Admin:

radius_search_input

dark

optional shadows (shadow_museum_tile, shadow_search_input)

unused iconography fields

unused motion fields

unused typography weights

These fields are hidden because they are either:

derived from other tokens

not yet supported in the public UI

reserved for future dark-mode or advanced UI features

## Derived Fields (Not stored)
The following fields are derived in code and never stored:

--color-* aliases

derived radii (--radius-sm … --radius-4xl)

derived typography variables

derived motion variables

dark-mode aliases

Admin must not expose these fields.