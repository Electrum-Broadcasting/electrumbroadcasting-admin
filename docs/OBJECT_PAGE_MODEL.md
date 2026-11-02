# OBJECT_PAGE_MODEL.md
Electrum — Object Page Model
Compatibility: DATA_MODEL.md · PANORAMA_MODEL.md · HOTSPOT_MODEL.md · CITY_ADMIN_WORKFLOW.md · CONTRIBUTING.md · ARCHITECTURE.md
Last updated: 2026-10-09

## 1. Purpose & Scope
An Object Page is the public-facing detail page for a single civic object. It is the destination a user reaches when they:

Activate a hotspot inside a 360° panorama viewer

Follow a city_navigation link

Navigate directly to /[objectType]/[slug]

Tap an AR marker or scan a QR code anchored to a real-world location

This document defines:

URL routing and slug rules

The page data contract — what is fetched and from which table

Page composition — sections, their data sources, and render conditions

The civic_object_page_settings table (new; extends DATA_MODEL)

Public loader requirements per CONTRIBUTING.md §3

RLS aligned to DATA_MODEL.md §7

Admin preview mode and City Admin configuration options

Unity / VR / AR surface mapping

Audit log wiring

For panorama and hotspot schema, see PANORAMA_MODEL.md and HOTSPOT_MODEL.md.
For story detail pages, see STORY_PAGE_MODEL.md.

## 2. URL Routing
Code

/[objectType]/[slug]
All Object Page routes must first resolve city identity via deriveCityFromHostname(),
then perform slug lookup via loadCityBySlug (server-side only).

### 2.1 Object Type → URL Segment
civic table	URL segment	Name column
civic_entities	entities	name
civic_events	events	name
civic_places	places	name
civic_moments	moments	title
civic_artifacts	artifacts	title
civic_neighborhoods	neighborhoods	name


### 2.2 Existing routes confirmed by ARCHITECTURE.md and CONTRIBUTING.md

/events/[eventSlug]
/stories/[storySlug]    ← Story Page (see STORY_PAGE_MODEL.md)
/eras/[eraSlug]

The following routes are added by this document:

/entities/[slug]
/places/[slug]
/moments/[slug]
/artifacts/[slug]
/neighborhoods/[slug]
All of these must be registered in CONTRIBUTING.md §3.2 as pages that use loadCityBySlug.

### 2.3 Slug rules
Slugs are unique within the combination of (city_id, civic object type table).

Slugs are lowercase, hyphen-separated, URL-safe, max 120 characters.

Slug changes generate a 301 redirect from the old slug for 90 days.

Slug is set at civic object creation or approval; editable by City Admin in Object Manager.

### 2.4 Eligibility gate
A page is publicly accessible only when all of the following are true:

is_published = true
AND (status IS NULL OR status = 'approved')   -- ingestion status guard
AND city_id matches the city_id derived from hostname
Any other state → 404. No information about status, review_status, or is_published is leaked in the 404 response.

## 3. Page Data Contract
The following data is fetched server-side, scoped by city_id. All queries run under the anon role and must respect RLS.

### 3.1 Primary civic object record
Fetched from the relevant civic_* table. Columns consumed vary by type (see §4.4). All types share:

Column	Used for
id	All downstream queries
city_id	Scoping, breadcrumb
slug	URL, canonical link, OG url
name / title	Page <h1>, <title>, OG title
description	Hero body text
is_published	Publication gate
status	Ingestion gate
tags	Tag chips (where available)
hero_image_url	Hero image (entities, artifacts)
hero_360_url	Viewer fallback (entities, artifacts, stories)
thumbnail_360_url	Viewer fallback (events, moments)
thumbnail_url	Card image (entities)
media_urls	Media gallery (entities, artifacts)


### 3.2 Panoramas
sql

SELECT
  id, label, description, equirectangular_url, thumbnail_url,
  pan_x_initial, pan_y_initial, display_order, capture_attribution, metadata
FROM panoramas
WHERE civic_object_id   = :object_id
  AND civic_object_type = :object_type
  AND status            = 'published'
ORDER BY display_order ASC;
One or more rows → render the Panorama Viewer (§4.2) with the primary panorama (display_order lowest).

Zero rows, hero_360_url or thumbnail_360_url IS NOT NULL → render simplified viewer using that URL directly. Initial pan_x = 0.5, pan_y = 0.5.

Zero rows, no 360° URL → render static hero image (hero_image_url) or placeholder.

### 3.3 Hotspots
sql

SELECT
  id, pan_x, pan_y, target_type, target_id, target_url,
  label, icon, display_order, metadata, behavior
FROM hotspots
WHERE panorama_id = :primary_panorama_id
  AND is_active   = true
ORDER BY display_order ASC;
Loaded per panorama. When the user switches panoramas in the carousel (§4.3), the viewer fetches hotspots for the newly selected panorama via a client-side request.

### 3.4 Related stories
Stories are linked to civic objects via the related_*_ids array columns on civic_stories (DATA_MODEL.md §3). There is no linked_object_id column; the query uses ANY():

sql

-- For civic_place:
SELECT id, title, slug, published_at, hero_image_url, summary, category
FROM civic_stories
WHERE city_id        = :city_id
  AND review_status  = 'published'
  AND safety_hold    = false
  AND :object_id     = ANY(related_place_ids)
ORDER BY published_at DESC
LIMIT 5;

-- For civic_entity:
  AND :object_id = ANY(related_entity_ids)

-- For civic_moment:
  AND :object_id = ANY(related_moment_ids)

-- For civic_event:
  AND :object_id = ANY(related_event_ids)

-- For civic_artifact, civic_neighborhood:
  -- No dedicated related_*_ids array exists.
  -- Use civic_relationships to find connected stories:
  AND EXISTS (
    SELECT 1 FROM civic_relationships
    WHERE from_type = :object_type
      AND from_id   = :object_id
      AND to_type   = 'civic_story'
  )

### 3.5 Nearby objects (civic_places only)
Only civic_places carries latitude / longitude columns. The Nearby Map (§4.7) is therefore only rendered on Place Object Pages by default. Other object types may surface nearby places by joining through civic_relationships or moment_places.

sql

SELECT
  id, name, slug, place_type, latitude, longitude,
  SQRT(
    POW(latitude  - :subject_lat, 2) +
    POW(longitude - :subject_lon, 2)
  ) AS approx_distance
FROM civic_places
WHERE city_id      = :city_id
  AND is_published = true
  AND id           <> :object_id
ORDER BY approx_distance ASC
LIMIT 6;
Note: For production, replace the Euclidean approximation with a PostGIS ST_DWithin query. The column names latitude and longitude are confirmed from DATA_MODEL.md §3 (civic_places).

### 3.6 Admin-configured page settings
sql

SELECT *
FROM civic_object_page_settings
WHERE civic_object_id   = :object_id
  AND civic_object_type = :object_type;
See §5 for schema. This table is fetched by the server-side loader. Anon access is limited to the
allowlisted presentation and SEO columns documented in SUPABASE_RLS_GUIDE.md.

## 4. Page Composition — Sections
Sections render conditionally based on data availability. The order below is the default render order.

┌───────────────────────────────────────────────────────────────┐
│ 4.1  Breadcrumb & City Context Bar                            │
├───────────────────────────────────────────────────────────────┤
│ 4.2  Panorama Viewer                                          │
│      └── Hotspot overlays                                     │
├───────────────────────────────────────────────────────────────┤
│ 4.3  Panorama Carousel         (if > 1 panorama)              │
├───────────────────────────────────────────────────────────────┤
│ 4.4  Hero — Name/Title, Description, Metadata Panel           │
│      └── Action Bar (Share, Bookmark, Open in VR)             │
├───────────────────────────────────────────────────────────────┤
│ 4.5  Media Gallery             (if media_urls present)        │
├───────────────────────────────────────────────────────────────┤
│ 4.6  Related Stories           (if any published stories)     │
├───────────────────────────────────────────────────────────────┤
│ 4.7  Nearby Places Map         (civic_place pages only)       │
├───────────────────────────────────────────────────────────────┤
│ 4.8  Sponsor Attribution       (if active allocation)         │
└───────────────────────────────────────────────────────────────┘
### 4.1 Breadcrumb & City Context Bar

[City Name] › [Object Type Label] › [Object Name/Title]
City Name → /

Object Type Label → /[objectType] (index page)

Applies city_design_system.published_theme tokens (THEME_SCHEMA.md canonical shape: colors.foreground, typography.heading).

### 4.2 Panorama Viewer
Full-width 360° interactive viewer.

Opens at pan_x_initial, pan_y_initial from the primary panorama row. Falls back to 0.5, 0.5 when using hero_360_url / thumbnail_360_url directly.

Renders all active hotspots for the loaded panorama at their (pan_x, pan_y) positions. The viewer converts pan_x/pan_y to its internal coordinate system at render time (HOTSPOT_MODEL.md §2).

Hotspot callout card on click/tap: label, metadata.short_description, icon, CTA button.

CTA resolution by target_type:

target_type	CTA action
civic_entity / event / place / moment / artifact / neighborhood	Navigate to that Object Page
civic_story	Navigate to Story Page
panorama	Replace viewer with destination panorama (no page navigation)
external_url	Open target_url in new tab


Viewer controls: drag-to-look, pinch-to-zoom, fullscreen toggle, gyroscope (mobile).

Keyboard: arrow keys to look; Tab to cycle between hotspots; Enter to activate focused hotspot.

Screen reader: each hotspot marker has aria-label = hotspot.label; hotspot list announced on viewer focus.

Fallback: if WebGL unavailable → static thumbnail_url from the primary panorama row.

Conditional: section omitted entirely when no panorama and no 360° URL exists.

### 4.3 Panorama Carousel
Rendered below the viewer when two or more published panoramas exist.

Horizontal strip of thumbnail_url images with label captions.

Clicking a thumbnail:

Loads that panorama's equirectangular_url into the viewer, resetting to that panorama's pan_x_initial/pan_y_initial.

Fetches and renders hotspots for the newly selected panorama.

Conditional: hidden when the object has exactly one panorama.

### 4.4 Hero — Name/Title, Description, Metadata Panel
Title block

<h1>: name (entities, events, places, neighborhoods) or title (moments, artifacts).

Semantic subtitle per type (see below).

Metadata Panel — rendered as a definition list or key-value grid. Fields by object type:

Object type	Fields shown
civic_entity	entity_type, roles, birth_year–death_year, year
civic_event	event_type, start_date–end_date, severity
civic_place	place_type, neighborhood, year_built–year_demolished, latitude/longitude (mini map pin)
civic_moment	moment_time, linked entities (via moment_entities), linked places (via moment_places)
civic_artifact	artifact_type, year
civic_neighborhood	name, linked moments count (via moment_neighborhoods)


Tags — rendered as chips from the tags ARRAY column (available on entities, events, artifacts, stories). Each chip links to /[objectType]?tag=[tag].

capture_attribution — if the primary panorama has a capture_attribution value, it is shown as a small credit line beneath the viewer or within the metadata panel.

Action bar:

Share — native Web Share API; falls back to copy-link.

Bookmark — authenticated users only; client-side, no server persistence in v1.

Open in VR — shown when civic_object_page_settings.enable_vr_button = true AND navigator.xr is available (see §6.2).

Open in AR — shown when civic_object_page_settings.enable_ar_button = true AND the AR module launch flag is active (see §6.3).

### 4.5 Media Gallery
Source: media_urls ARRAY (available on civic_entities, civic_artifacts). media_url (single, civic_artifacts) is also shown when present.

Rendered as a masonry grid (≥ 3 items) or horizontal strip (1–2 items).

Lightbox on click.

Conditional: section hidden when media_urls is empty or NULL.

### 4.6 Related Stories
Source: civic_stories queried via related_*_ids array membership (see §3.4).

Renders up to 5 story cards: hero_image_url, title, category, published_at, summary (truncated to 120 chars).

Each card links to /stories/[slug].

"View all stories" link when > 5 exist.

Conditional: section hidden when no published, non-held stories are linked.

### 4.7 Nearby Places Map
Source: civic_places within approximate radius (see §3.5).

Interactive map (Mapbox / Leaflet) centred on subject object's latitude/longitude.

Up to 6 place pins; each links to that place's Object Page.

Conditional: rendered only on civic_place Object Pages where latitude/longitude IS NOT NULL and at least one nearby place is found. Other object types may opt in via civic_object_page_settings.show_nearby_map = true if they can be joined to a place coordinate.

### 4.8 Sponsor Attribution
Source: sponsor_allocations for the city. (DATA_MODEL.md §3 — sponsor_allocations)

Renders: sponsor logo (from sponsors.logo_url), sponsor name, linked to sponsor URL.

Conditional: only when civic_object_page_settings.show_sponsor_bar = true and an active sponsor_allocations row exists for city_id.

## 5. civic_object_page_settings Table
City Admins may override default page behaviour per object. This table is new and must be added to DATA_MODEL.md §2 (under a new Page Configuration Tables group).

CREATE TABLE civic_object_page_settings (
  -- ── Identity ──────────────────────────────────────────────────────────────
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id             UUID    NOT NULL REFERENCES cities(id),
  civic_object_id     UUID    NOT NULL,
  civic_object_type   TEXT    NOT NULL CHECK (civic_object_type IN (
                                'civic_entity',
                                'civic_event',
                                'civic_place',
                                'civic_moment',
                                'civic_artifact',
                                'civic_neighborhood'
                              )),

  -- ── Section visibility ────────────────────────────────────────────────────
  show_nearby_map       BOOLEAN NOT NULL DEFAULT true,
  show_related_stories  BOOLEAN NOT NULL DEFAULT true,
  show_media_gallery    BOOLEAN NOT NULL DEFAULT true,
  show_sponsor_bar      BOOLEAN NOT NULL DEFAULT true,

  -- ── SEO ───────────────────────────────────────────────────────────────────
  seo_title             TEXT    CHECK (char_length(seo_title)       <= 70),
  seo_description       TEXT    CHECK (char_length(seo_description) <= 160),
  canonical_url         TEXT,

  -- ── Social share ──────────────────────────────────────────────────────────
  -- Overrides the default OG image (primary panorama thumbnail_url).
  og_image_url          TEXT,

  -- ── Feature flags ─────────────────────────────────────────────────────────
  enable_vr_button      BOOLEAN NOT NULL DEFAULT true,
  -- AR is gated behind a global launch flag in addition to this row-level flag.
  enable_ar_button      BOOLEAN NOT NULL DEFAULT false,

  -- ── Admin / audit ─────────────────────────────────────────────────────────
  updated_by            UUID    REFERENCES admin_users(id),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (civic_object_id, civic_object_type)
);

### 5.1 Default row creation
A civic_object_page_settings row with all defaults is created automatically when a civic object is inserted as published or first transitions to published:

CREATE OR REPLACE FUNCTION create_object_page_settings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_published = true AND (NEW.status IS NULL OR NEW.status = 'approved') THEN
    -- civic_object_type stores the singular discriminator, not TG_TABLE_NAME.
    INSERT INTO civic_object_page_settings (city_id, civic_object_id, civic_object_type)
    VALUES (
      NEW.city_id,
      NEW.id,
      CASE TG_TABLE_NAME
        WHEN 'civic_entities' THEN 'civic_entity'
        WHEN 'civic_events' THEN 'civic_event'
        WHEN 'civic_places' THEN 'civic_place'
        WHEN 'civic_moments' THEN 'civic_moment'
        WHEN 'civic_artifacts' THEN 'civic_artifact'
        WHEN 'civic_neighborhoods' THEN 'civic_neighborhood'
      END
    )
    ON CONFLICT (civic_object_id, civic_object_type) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply to each civic table:
CREATE TRIGGER trg_civic_entities_page_settings
  AFTER INSERT OR UPDATE ON civic_entities
  FOR EACH ROW EXECUTE FUNCTION create_object_page_settings();

-- Repeat for civic_events, civic_places, civic_moments,
-- civic_artifacts, civic_neighborhoods.

### 5.2 RLS

ALTER TABLE civic_object_page_settings ENABLE ROW LEVEL SECURITY;

-- City Admin + CEO: full CRUD, city-scoped
CREATE POLICY page_settings_admin ON public.civic_object_page_settings
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids)
      FROM   admin_users
      WHERE  auth_uid = auth.uid()::text
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids)
      FROM   admin_users
      WHERE  auth_uid = auth.uid()::text
    )
  );

-- Public server loader: anon may read only presentation/SEO columns listed in
-- DATA_MODEL.md §3.34. updated_by and updated_at are not granted to anon and are
-- never forwarded to browser components.

## 6. Public Loader Requirements
All public loader queries must use the server-side anon Supabase client (createServerClient).
This is required for hostname-derived city identity, slug lookup, RLS-safe queries, and SSR/ISR rendering.

The browser client (createBrowserClient) is used only for client-side interactions
(e.g., hotspot switching, pagination, or viewer-side incremental fetches).

### 6.1 Loader additions required in CONTRIBUTING.md §3.2
The following routes must be added to the list of pages that call loadCityBySlug:

/entities/[slug]
/places/[slug]
/moments/[slug]
/artifacts/[slug]
/neighborhoods/[slug]
/eras/[slug]
/events/[slug]


### 6.2 New loader: loadCivicObject
A canonical loader function is needed for all Object Pages:

loadCivicObject(
  objectType:       CivicObjectType,
  objectSlug:       string,
  options?:         { draft?: boolean }
): Promise<CivicObjectPageData>

It must:

Resolve city identity via deriveCityFromHostname(), then perform slug lookup via loadCityBySlug (server-side only).

Fetch the civic object record (gate: is_published = true).

Fetch published panoramas ordered by display_order.

Fetch hotspots for the primary panorama (is_active = true).

Fetch up to 5 related stories using the ANY(related_*_ids) pattern.

Fetch civic_object_page_settings for the object.

Use the server-side anon Supabase client (createServerClient) for all public loader queries.

Browser client is used only for client-side interactions (e.g., hotspot fetches).
Return a consistent shape regardless of object type.

### 6.3 Data Model additions to DATA_MODEL.md §8.1
The following entry must be added to the Public Queries table (DATA_MODEL.md §8.1):

Object Page — loads civic object details, immersive media, and editorial context.

civic_[type] (primary object)

panoramas (where civic_object_id + civic_object_type match; status = 'published'; ordered by display_order)

hotspots (where panorama_id = primary panorama; is_active = true)

civic_stories (where is_published = true, safety_hold = false, object id in related_*_ids)

civic_object_page_settings (server-side loader; anon can select only the allowlisted presentation and SEO columns)

## 7. UI Requirements
Requirement	Detail
SSR / ISR	Server-rendered; revalidated on civic object publish/update. CDN cache TTL: 60 s.
On-demand revalidation	revalidatePath('/[type]/[slug]') called by publish RPC.
404 behaviour	is_published = false → 404; no status leak.
Slug redirect	Old slug → 301 to current slug for 90 days after slug change.
Responsive	Mobile-first; panorama viewer full-width on small screens; metadata panel stacks below viewer.
Viewer skeleton	Panorama section shows skeleton UI until equirectangular_url asset loaded.
WebGL fallback	Viewer unavailable → static thumbnail_url; hotspot list rendered as accessible text list.
Theme	Applies published city_design_system canonical theme (THEME_SCHEMA.md).
OG tags	og:title = name/title; og:image = og_image_url ?? primary panorama thumbnail_url ?? hero_image_url; og:type = place or article per object type.
JSON-LD	TouristAttraction (places), Event (events), Person/Organization (entities), per schema.org.
Analytics	Page view event emitted with city_id, civic_object_type, civic_object_id. Not emitted in admin preview mode.
Print	Print stylesheet hides viewer, carousel, map, sponsor bar. Retains title, metadata panel, related stories list.


### 7.1 Admin Preview Mode
When an authenticated City Admin visits an Object Page for their city, the page loads in preview mode:

Draft panoramas shown with a "Draft" badge.

Inactive hotspots shown with a ghost marker style.

civic_object_page_settings applied from current (non-default) saved state.

Unpublished related stories shown with an "Unpublished" badge.

No analytics events emitted.

A floating admin toolbar appears with shortcuts to Object Manager, Panorama Editor, and Page Settings.

Preview mode is activated when the server detects a valid admin session cookie and the requested object's city_id is in the admin's city_ids array.

### 7.2 Open in VR
When civic_object_page_settings.enable_vr_button = true and navigator.xr returns a supported immersive-vr session:

Enters a WebXR immersive-vr session.

Loads the primary panorama's equirectangular_url onto a WebXR sphere.

Sets the initial gaze heading from pan_x_initial/pan_y_initial.

Projects all active hotspots at their (pan_x, pan_y) positions (or from behavior.world_position if pre-computed).

Renders hotspot callout cards as floating 3D panels.

Supports 3DoF (Cardboard) and 6DoF (Quest, Vive) headsets.

Behavior keys from hotspots.behavior are consumed by the VR layer (linger_ms, haptic_preset, animation, interaction_radius). See HOTSPOT_MODEL.md §12.

### 7.3 Open in AR
When civic_object_page_settings.enable_ar_button = true and the global AR launch flag is active:

Checks panoramas.metadata.spatial_anchor_id on the primary panorama.

If present, uses the Azure Spatial Anchor to locate the civic object in real-world space.

Overlays the Object Page metadata panel as a floating AR card visible through the device camera.

Renders hotspots as world-anchored 3D markers.

If no spatial_anchor_id exists, the AR button is hidden regardless of the setting.

## 8. City Admin Configuration — Object Page Settings
City Admins access Object Page settings from the Object Manager:

Object Manager → [Civic object] → Page Settings tab
Available actions:

Toggle section visibility: nearby map, related stories, media gallery, sponsor bar

Override SEO title (max 70 chars) and meta description (max 160 chars)

Upload a custom OG image (stored in universal-media/cities/<cityId>/entities/ or appropriate domain folder)

Enable / disable VR button

Enable AR button (gated behind AR module launch flag)

Set canonical URL (requires CEO authorization for cross-city use)

All saves to civic_object_page_settings are written to admin_action_logs:

domain       = 'civic'
entity_type  = 'civic_object_page_settings'
entity_id    = civic_object_page_settings.id
action       = 'page_settings_edited'
metadata     = { changed_fields: { field: { old, new } } }
9. Audit Log Wiring
action	domain	entity_type	Trigger
page_settings_edited	civic	civic_object_page_settings	Any field in page settings updated
object_approved	civic	civic_[type]	Civic object approved (existing)
media_uploaded	civic	civic_[type]	New panorama published (see PANORAMA_MODEL.md §11)


The action string is defined in CITY_ADMIN_WORKFLOW.md and DATA_MODEL.md §14.3.

## 10. Future-Proofing Notes
### 10.1 Unity Object Page
The Unity client renders an equivalent Object Page as a CivicObjectScene:

Panorama → Panorama360Controller.cs textures a sphere with equirectangular_url.

Initial heading → pan_x_initial/pan_y_initial converted to camera Euler angles at scene load.

Hotspots → HotspotManager.cs reads behavior.world_position (or projects pan_x/pan_y onto the sphere) and spawns prefabs.

Metadata Panel → CivicObjectInfoPanel.cs renders name/title, description, metadata fields.

Related Stories → StoryCardList.cs renders cards in a scrollable Unity UI panel.

Nearby Map → NearbyObjectsMap.cs renders a mini-map using Mapbox SDK for Unity, consuming latitude/longitude directly.

### 10.2 AR Overlay
When spatial_anchor_id is populated (PANORAMA_MODEL.md §14.2), the Electrum AR mobile app surfaces the Object Page metadata as a world-anchored floating card at the physical location of the civic object. No schema change required.

### 10.3 Per-type page templates (future)
civic_object_page_settings may gain a layout_template column in a future release, allowing City Admins to select from city-specific layout variants (e.g., 'timeline' for civic_events, 'map-first' for civic_places). The column is reserved; do not use layout_template as a metadata key in the meantime.

### 10.4 Cross-city object pages
canonical_url in civic_object_page_settings supports cross-city object references (e.g., a civic entity that exists in two cities). CEO authorization is required. The canonical URL is emitted as <link rel="canonical" href="..."> in the page <head>.