# STORY_PAGE_MODEL.md
Electrum — Story Page Model
Compatibility: DATA_MODEL.md · OBJECT_PAGE_MODEL.md · PANORAMA_MODEL.md · HOTSPOT_MODEL.md · CITY_ADMIN_WORKFLOW.md · CONTRIBUTING.md · ARCHITECTURE.md · RATE_CARD.md
Last updated: 2026-10-09

## 1. Purpose & Scope
A Story Page is the public-facing detail page for a single civic_stories row. Stories are editorial pieces written by Contributors, reviewed by Editors, and published by City Admins through the editorial workflow (CITY_ADMIN_WORKFLOW.md §4, §11).

Story Pages are reached via:

A hotspot inside a 360° panorama viewer (target_type = 'civic_story')

The Related Stories section on an Object Page (OBJECT_PAGE_MODEL.md §4.6)

A city_navigation link

Direct URL: /stories/[storySlug]

The city's story index: /stories

This document defines:

URL routing and slug rules

The page data contract — civic_stories columns consumed and their render targets

Page composition — sections, data sources, and render conditions

Inline 360° viewer behaviour and its relationship to the panoramas table

The story_page_settings table (new; extends DATA_MODEL)

Public loader requirements per CONTRIBUTING.md §3

RLS aligned to DATA_MODEL.md §7

Admin preview mode and City Admin configuration

Unity / VR / AR surface mapping

Audit log wiring

For immersive media schema, see PANORAMA_MODEL.md and HOTSPOT_MODEL.md.
For civic object detail pages, see OBJECT_PAGE_MODEL.md.

## 2. URL Routing

/stories/[storySlug]
This route is already established in ARCHITECTURE.md §2.3 and listed in CONTRIBUTING.md §3.2. No routing additions are required.

### 2.1 Slug rules
slug is unique within city_id on civic_stories.

Slug is lowercase, hyphen-separated, URL-safe, max 120 characters.

Slug is set by the Contributor on submission; editable by Editors and City Admins.

Slug changes generate a 301 redirect from the old slug for 90 days.

### 2.2 Eligibility gate
A Story Page is publicly accessible only when all of the following are true:

review_status = 'published'
AND safety_hold = false
AND is_published = true
AND city_id matches the city_id derived from hostname
Any other state → 404. No information about review_status, safety_hold, or is_published is leaked in the 404 response.

## 3. civic_stories Fields Consumed by the Story Page
The full civic_stories row is fetched server-side. Fields are grouped below by their render target.

Media authority: ordinary story hero and thumbnail media come from primary
`civic_media_attachments` rows with roles `hero` and `thumbnail`, resolved
through `media_assets.url`. The canonical story hero panorama comes from a
published `panoramas` row with `civic_object_type = 'civic_story'`; the primary row is the one with
the lowest `display_order`. `hero_360_url` is generated from that row.
`hero_image_url` and `inline_360_urls` are legacy compatibility fields slated
for future deprecation; existing values may be read only during migration, and
must not be treated as authoritative or receive new uploads.

### 3.1 Gate fields (server-side only; not rendered publicly)
Column	Type	Gate condition
review_status	text	Must be 'published'
safety_hold	boolean	Must be false
is_published	boolean	Must be true
is_frozen	boolean	Informational only; frozen stories remain published


### 3.2 Core display fields
Column	Rendered as
title	<h1>, <title>, OG title
slug	URL, canonical link
summary	Subtitle / teaser below the title; OG description
body	Article body (rich text / MDX)
Primary hero attachment	Hero image above the title; legacy hero_image_url is a migration fallback only
published_at	Publication date in the byline
author_name	Author attribution in the byline (text; not a FK)
category	Category badge in the byline
year	Displayed in metadata bar when published_at is absent
date_range	Displayed in metadata bar as the story's temporal scope
neighborhood	Displayed in metadata bar
tags	Tag chips; each links to /stories?tag=[tag]
city_id	City breadcrumb


### 3.3 Immersive media fields
Column	Type	Used for
Primary published panoramas row	Primary 360° viewer in the Hero section (§4.2)
panoramas.thumbnail_url	Flat thumbnail for the panorama viewer before load
hero_360_url	Generated compatibility URL from the primary published panorama; not uploaded or authored
inline_360_urls	ARRAY	Legacy inline 360° embeds for existing rows only; slated for future deprecation
neighborhood_360_url	text	Secondary 360° embed; shown in a dedicated neighbourhood context section when present
sponsor_360_url	text	Sponsor-provided 360° asset; shown in Sponsor Attribution (§4.8)
sponsor_flat_url	text	Sponsor flat image; fallback if sponsor_360_url is absent


### 3.4 Contributor / editorial fields (server-side only)
Column	Use
contributor_id	Resolved to contributor display name and profile (see §3.5)
editor_id	Internal; not shown publicly
review_notes	Internal; not shown publicly
revision_notes	Internal; not shown publicly
flag_reason	Internal; not shown publicly
safety_hold_notes	Internal; not shown publicly


### 3.5 Contributor attribution
civic_stories.contributor_id → admin_users.id (or contributors.id if a separate contributors table is used). The Story Page renders the contributor's public display name and avatar. If the contributor record is unavailable, author_name (text) is used as the fallback byline.

### 3.6 Sponsor fields
Column	Rendered as
sponsor_name	Sponsor attribution name
sponsor_link	Hyperlink on sponsor attribution
sponsor_alt_text	Alt text for sponsor image
sponsor_flat_url	Sponsor flat logo image
sponsor_360_url	Sponsor 360° asset (rendered in sponsor section if present)

These fields are story-level sponsor overrides. If all are NULL, the city-level sponsor_allocations fallback is used (§4.8).

### 3.7 Content tier
civic_stories does not carry content_tier directly. Tier is stored on the associated production_units row (production_units.content_tier). The Story Page resolves it by joining:

SELECT pu.content_tier
FROM   production_units pu
WHERE  pu.id = civic_stories.production_unit_id  -- FK assumed; see §9.1
LIMIT  1;
content_tier drives the Tier Badge in the byline (standard | feature | investigation). If no production_unit is found, the tier badge is omitted.

## 4. Page Composition — Sections

┌────────────────────────────────────────────────────────────────┐
│ 4.1  Breadcrumb & City Context Bar                             │
├────────────────────────────────────────────────────────────────┤
│ 4.2  Hero — image and/or 360° Viewer                           │
├────────────────────────────────────────────────────────────────┤
│ 4.3  Title, Byline & Metadata Bar                              │
│      (title, contributor, date, tier badge, category, tags)    │
│      └── Action Bar (Share, Bookmark, Open in VR)              │
├────────────────────────────────────────────────────────────────┤
│ 4.4  Story Body (rich text)                                    │
├────────────────────────────────────────────────────────────────┤
│ 4.5  Inline 360° Embeds       (legacy compatibility only)      │
├────────────────────────────────────────────────────────────────┤
│ 4.6  Neighbourhood 360°       (from neighborhood_360_url)      │
├────────────────────────────────────────────────────────────────┤
│ 4.7  Linked Civic Objects     (via related_*_ids arrays)       │
├────────────────────────────────────────────────────────────────┤
│ 4.8  Sponsor Attribution                                       │
├────────────────────────────────────────────────────────────────┤
│ 4.9  Related Stories                                           │
└────────────────────────────────────────────────────────────────┘
### 4.1 Breadcrumb & City Context Bar

[City Name] › Stories › [Story Title]
City Name → / domain

Stories → /stories

Applies city_design_system.published_theme canonical tokens (THEME_SCHEMA.md: colors.foreground, typography.heading, typography.body).

### 4.2 Hero — Image and/or 360° Viewer
Priority order for the hero media slot:

1. If a primary published `panoramas` row exists for this story, render the
   full-width viewer from its `equirectangular_url` and use its `thumbnail_url`
   as the poster.
2. Otherwise, render the primary hero attachment from
   `civic_media_attachments` / `media_assets`.
3. During migration only, existing `hero_360_url` or `hero_image_url` values
   may be read as compatibility fallbacks. They are not upload targets or
   canonical sources.
4. If none are available, omit the hero media section.

360° viewer behaviour on Story Pages:

Viewer heading and metadata come from the panorama row.

Hotspots and panorama interactions follow PANORAMA_MODEL.md and
HOTSPOT_MODEL.md for the story's panorama row.

Viewer controls: drag-to-look, pinch-to-zoom, fullscreen.

Keyboard: arrow keys to look.

Fallback: if WebGL is unavailable, show the panorama thumbnail; if no panorama
exists, show the primary hero attachment. Legacy thumbnail_360_url and
hero_image_url values are migration fallbacks only.

### 4.3 Title, Byline & Metadata Bar
Title block

<h1>: civic_stories.title

Subtitle: summary (rendered below the title, above the byline)

Byline (single line, separated by ·):

Contributor display name (from contributor_id → contributor profile) or author_name fallback

Formatted published_at date (city locale)

Content tier badge: Standard / Feature / Investigation (from production_units.content_tier)

category badge

Metadata bar (rendered as a tag strip):

tags → chips linking to /stories?tag=[tag]

neighborhood → links to /neighborhoods/[neighborhoodSlug] if the neighborhood is published

date_range → displayed as a plain text range label

Action bar:

Share — native Web Share API; falls back to copy-link

Bookmark — authenticated users only; client-side, no server persistence in v1

Open in VR — shown when story_page_settings.enable_vr_button = true, a
primary published story panorama exists, and navigator.xr is available (see §6.2)

Reading time — estimated reading time computed from body word count ÷ 200 wpm

### 4.4 Story Body
Source: civic_stories.body (rich text / MDX).

Rendered as semantic HTML.

Supported elements: headings (h2–h4), paragraphs, blockquotes, ordered/unordered lists, bold, italic, inline links, inline code, horizontal rules.

External links: open in new tab with rel="noopener noreferrer".

Internal links (matching /...): navigate in-place.

Images embedded in body: lazy-loaded; CDN sizing params applied.

A thin reading progress bar is shown at the top of the viewport on desktop, advancing as the user scrolls through the body.

### 4.5 Inline 360° Embeds
Existing inline embeds may temporarily read `civic_stories.inline_360_urls`
for compatibility. This field is slated for future deprecation and is not an
upload target or authoritative panorama source. New story panoramas must be
stored as `panoramas` rows with `civic_object_type = 'civic_story'`.

Each existing compatibility URL is rendered as a constrained-width inline 360°
viewer (not full-width) within the story body flow.

Legacy inline viewers open at the image centre and do not support hotspots.
This describes compatibility behavior only; canonical story panoramas follow
PANORAMA_MODEL.md and HOTSPOT_MODEL.md.

Fullscreen toggle expands each embed to full-width.

Each embed may carry an optional caption sourced from story_page_settings.inline_360_captions (see §5).

Conditional: during migration, render existing inline embeds only when
inline_360_urls is non-empty and story_page_settings.enable_inline_360 = true.

### 4.6 Neighbourhood 360°
Source: civic_stories.neighborhood_360_url (text, CDN URL).

Rendered as a full-width 360° viewer in a dedicated section between the body and linked objects.

Section label: "[Neighbourhood name] in 360°" — uses civic_stories.neighborhood for the label.

Existing neighborhood_360_url viewers open at the image centre and do not
support hotspots. Canonical story panoramas follow PANORAMA_MODEL.md and
HOTSPOT_MODEL.md.

Conditional: hidden when neighborhood_360_url IS NULL.

### 4.7 Linked Civic Objects
Stories carry related_place_ids, related_entity_ids, related_moment_ids, and related_event_ids arrays (DATA_MODEL.md §3). The Story Page fetches and renders a card strip of the linked civic objects.

-- Fetch up to 2 linked places with their primary thumbnail attachments
SELECT p.id, p.name, p.slug, p.place_type, thumb_asset.url AS thumbnail_url
FROM civic_places p
LEFT JOIN civic_media_attachments thumb_attachment
  ON thumb_attachment.city_id = p.city_id
 AND thumb_attachment.civic_object_id = p.id
 AND thumb_attachment.civic_object_type = 'civic_place'
 AND thumb_attachment.role = 'thumbnail'
 AND thumb_attachment.is_primary = true
LEFT JOIN media_assets thumb_asset ON thumb_asset.id = thumb_attachment.media_asset_id
WHERE p.id = ANY(:related_place_ids)
  AND p.city_id      = :city_id
  AND p.is_published = true
LIMIT 2;

-- Fetch up to 2 linked entities with their primary thumbnail attachments
SELECT e.id, e.name, e.slug, e.entity_type, thumb_asset.url AS thumbnail_url
FROM civic_entities e
LEFT JOIN civic_media_attachments thumb_attachment
  ON thumb_attachment.city_id = e.city_id
 AND thumb_attachment.civic_object_id = e.id
 AND thumb_attachment.civic_object_type = 'civic_entity'
 AND thumb_attachment.role = 'thumbnail'
 AND thumb_attachment.is_primary = true
LEFT JOIN media_assets thumb_asset ON thumb_asset.id = thumb_attachment.media_asset_id
WHERE e.id = ANY(:related_entity_ids)
  AND e.city_id      = :city_id
  AND e.is_published = true
LIMIT 2;

-- Fetch up to 2 linked events
SELECT id, name, slug, event_type
FROM civic_events
WHERE id = ANY(:related_event_ids)
  AND city_id      = :city_id
  AND is_published = true
LIMIT 2;

-- Fetch up to 2 linked moments
SELECT id, title, slug, moment_time
FROM civic_moments
WHERE id = ANY(:related_moment_ids)
  AND city_id      = :city_id
  AND is_published = true
LIMIT 2;
Rendered as an object card strip:

Card: object type icon, name/title, type label, CTA "Explore →" linking to the Object Page.

Maximum 8 cards total across all types; ordered: places, entities, events, moments.

Conditional: section hidden when all related_*_ids arrays are empty or all linked objects are unpublished.

### 4.8 Sponsor Attribution
Story-level sponsor (from civic_stories sponsor fields):

If sponsor_name IS NOT NULL → render sponsor attribution using story-level fields (sponsor_name, sponsor_link, sponsor_alt_text, sponsor_flat_url).

If sponsor_360_url IS NOT NULL → render it as a 360° viewer in the sponsor section.

This takes precedence over city-level allocation.

City-level sponsor fallback (from sponsor_allocations):

If all story-level sponsor fields are NULL and story_page_settings.show_sponsor_bar = true → render city-level sponsor attribution from sponsor_allocations + sponsors.

Conditional: only when an active sponsor_allocations row exists for city_id.

### 4.9 Related Stories

SELECT s.id, s.title, s.slug, s.published_at, s.summary, s.category,
       hero_asset.url AS hero_url
FROM civic_stories s
LEFT JOIN civic_media_attachments hero_attachment
  ON hero_attachment.city_id = s.city_id
 AND hero_attachment.civic_object_id = s.id
 AND hero_attachment.civic_object_type = 'civic_story'
 AND hero_attachment.role = 'hero'
 AND hero_attachment.is_primary = true
LEFT JOIN media_assets hero_asset ON hero_asset.id = hero_attachment.media_asset_id
WHERE s.city_id        = :city_id
  AND s.review_status  = 'published'
  AND s.safety_hold    = false
  AND s.is_published   = true
  AND s.id             <> :current_story_id
  AND (
    s.tags && :current_tags::text[]          -- overlapping tags
    OR s.neighborhood = :current_neighborhood
    OR EXISTS (                            -- shared linked place
      SELECT 1
      FROM   unnest(s.related_place_ids) rp
      WHERE  rp = ANY(:current_related_place_ids)
    )
  )
ORDER BY s.published_at DESC
LIMIT 4;
Rendered as a horizontal card strip (desktop) or stacked list (mobile).

Card: primary hero attachment URL, title, category, published_at, summary
(truncated to 120 chars). The legacy hero_image_url is a migration fallback only.

Each card links to /stories/[slug].

Conditional: hidden when story_page_settings.show_related_stories = false or fewer than 2 results are found.

## 5. story_page_settings Table
City Admins may configure Story Page behaviour per story. This table is new and must be added to DATA_MODEL.md §2 under the Page Configuration Tables group (alongside civic_object_page_settings added by OBJECT_PAGE_MODEL.md).

CREATE TABLE story_page_settings (
  -- ── Identity ──────────────────────────────────────────────────────────────
  id                        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id                   UUID    NOT NULL REFERENCES cities(id),
  civic_story_id            UUID    NOT NULL REFERENCES civic_stories(id)
                                      ON DELETE CASCADE,

  -- ── Section visibility ────────────────────────────────────────────────────
  show_related_stories      BOOLEAN NOT NULL DEFAULT true,
  show_sponsor_bar          BOOLEAN NOT NULL DEFAULT true,
  show_production_attribution BOOLEAN NOT NULL DEFAULT false,

  -- ── Inline 360° ───────────────────────────────────────────────────────────
  -- Compatibility toggle for existing inline_360_urls embeds during migration.
  enable_inline_360         BOOLEAN NOT NULL DEFAULT true,
  -- Optional per-embed captions. Key = array index (0-based), value = caption text.
  inline_360_captions       JSONB   NOT NULL DEFAULT '{}',

  -- ── SEO ───────────────────────────────────────────────────────────────────
  seo_title                 TEXT    CHECK (char_length(seo_title)       <= 70),
  seo_description           TEXT    CHECK (char_length(seo_description) <= 160),
  canonical_url             TEXT,

  -- ── Social share ──────────────────────────────────────────────────────────
  -- Overrides the default OG image (primary hero attachment URL).
  og_image_url              TEXT,

  -- ── Feature flags ─────────────────────────────────────────────────────────
  -- VR button shown when a primary published panoramas row exists for the story.
  enable_vr_button          BOOLEAN NOT NULL DEFAULT true,
  -- AR is gated behind a global launch flag in addition to this flag.
  enable_ar_button          BOOLEAN NOT NULL DEFAULT false,

  -- ── Admin / audit ─────────────────────────────────────────────────────────
  updated_by                UUID    REFERENCES admin_users(id),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (civic_story_id)
);

### 5.1 Default row creation
A story_page_settings row with all defaults is created automatically when a story is inserted as published or first transitions to published:

sql

CREATE OR REPLACE FUNCTION create_story_page_settings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.review_status = 'published' AND NEW.is_published = true THEN
    INSERT INTO story_page_settings (city_id, civic_story_id)
    VALUES (NEW.city_id, NEW.id)
    ON CONFLICT (civic_story_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_story_page_settings_on_publish
  AFTER INSERT OR UPDATE ON civic_stories
  FOR EACH ROW EXECUTE FUNCTION create_story_page_settings();

### 5.2 RLS
sql

ALTER TABLE story_page_settings ENABLE ROW LEVEL SECURITY;

-- City Admin + CEO: full CRUD, city-scoped
CREATE POLICY story_page_settings_admin ON public.story_page_settings
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
-- DATA_MODEL.md §3.35. updated_by and updated_at are not granted to anon and are
-- never forwarded to browser components.
-- Editors: no access to page settings
Access summary

Role	SELECT	INSERT	UPDATE	DELETE
anon	Allowlisted columns	✗	✗	✗
contributor	✗	✗	✗	✗
editor	✗	✗	✗	✗
city_admin	Own city	Own city	Own city	Own city
ceo	All	All	All	All


## 6. Public Loader Requirements
All public loader queries must use the server-side anon Supabase client (createServerClient).
This is required for hostname-derived city identity, slug lookup, RLS-safe queries, and SSR/ISR rendering.

The browser client (createBrowserClient) is used only for client-side interactions
(e.g., hotspot switching, pagination, or viewer-side incremental fetches).

### 6.1 New loader: loadCivicStory

loadCivicStory(
  storySlug:   string,
  options?:    { draft?: boolean }
): Promise<StoryPageData>
It must:

Resolve city identity via deriveCityFromHostname(), then perform slug lookup via loadCityBySlug (server-side only).

Fetch the civic_stories row (gate: review_status = 'published', safety_hold = false, is_published = true).

Resolve contributor_id to contributor display name and avatar.

Fetch production_units.content_tier for the tier badge.

Fetch linked civic objects using ANY(related_*_ids) queries.

Fetch up to 4 related stories using the overlap query (§4.9).

Fetch story_page_settings for the story.

Use the server-side anon Supabase client (createServerClient) for all public loader queries.

Browser client is used only for client-side interactions (e.g., hotspot fetches).

Return a consistent shape.

### 6.2 Data Model additions to DATA_MODEL.md §8.1
Story Page — loads editorial narrative and its civic context.

civic_stories (primary; gate: review_status = 'published', safety_hold = false, is_published = true)

contributors / admin_users (contributor display name and avatar)

production_units (content_tier; via production_unit_id)

civic_places, civic_entities, civic_events, civic_moments (via related_*_ids arrays)

civic_stories (related stories; overlap query)

story_page_settings (server-side loader; anon can select only the allowlisted presentation and SEO columns)

## 7. UI Requirements
Requirement	Detail
SSR / ISR	Server-rendered; revalidated on publish/unpublish/safety hold changes. CDN cache TTL: 60 s.
On-demand revalidation	revalidatePath('/stories/[slug]') called by publish RPC and safety hold RPC.
404 behaviour	review_status ≠ 'published' OR safety_hold = true OR is_published = false → 404; no state leaked.
Slug redirect	Old slug → 301 to current slug for 90 days after slug change.
Responsive	Single-column mobile; two-column (body + sidebar) on desktop ≥ 1024 px. Sidebar: metadata bar, linked objects, related stories.
Reading progress bar	Thin bar at top of viewport (desktop); advances as user scrolls <article>.
Reading time	Estimated reading time in byline (body word count ÷ 200, rounded up to nearest minute).
Theme	Applies published city_design_system canonical theme (THEME_SCHEMA.md).
OG tags	og:type = article; og:title = story title; og:image = og_image_url ?? primary hero attachment URL; og:article:published_time = published_at.
JSON-LD	NewsArticle with author (contributor name), datePublished (published_at), publisher (city name), image (primary hero attachment URL).
Analytics	Page view event with city_id, civic_story_id, content_tier. Not emitted in admin preview mode.
Print	Print stylesheet hides nav, sidebars, sponsor bar, related stories, action bar. Retains title, byline, body, linked objects.


### 7.1 Admin Preview Mode
When an authenticated City Admin visits a Story Page for their city:

Stories with review_status = 'approved' (pending publication) are accessible in preview mode (not 404'd).

Safety-held stories (safety_hold = true) are accessible in preview mode with a prominent "Safety Hold" banner — not visible to anon.

Unpublished linked civic objects show an "Unpublished" badge on their cards — not visible to anon.

story_page_settings applied from current saved state.

No analytics events emitted.

A floating admin toolbar appears with shortcuts to Publication Queue and Story Page Settings.

### 7.2 Open in VR
When story_page_settings.enable_vr_button = true, a primary published
`panoramas` row exists for `civic_story`, and navigator.xr reports an
available immersive-vr session:

Enters a WebXR immersive-vr session.

Loads the primary panorama's equirectangular_url and initial heading.

Renders the story body text and byline as a floating 2D panel within the VR environment.

Legacy inline_360_urls values do not override the primary panorama.

Hotspots and panorama interactions follow PANORAMA_MODEL.md and
HOTSPOT_MODEL.md.

### 7.3 Open in AR (future)
When story_page_settings.enable_ar_button = true and the global AR launch flag is active:

If the story has linked civic_places with a civic_place that has a published panorama with spatial_anchor_id, the AR layer surfaces the story as a floating card anchored to that real-world location.

The AR entry point is otherwise hidden when no spatial anchor is resolvable from the story's linked objects.

## 8. Story Panoramas
### 8.1 Canonical representation
`civic_story` is a valid `panoramas.civic_object_type`. The canonical story
hero panorama is represented by a `panoramas` row, with the primary published row
rendered in the Story Page hero. `hero_360_url` is generated from that primary
row and is not an independent media source.

Panorama interaction and hotspot behavior for story-owned panoramas follow
PANORAMA_MODEL.md and HOTSPOT_MODEL.md. The legacy `hero_360_url` and
`inline_360_urls` fields are compatibility data only and do not define a
separate panorama model.

### 8.2 Relationship to place panoramas
When a story discusses a place with its own civic panorama, link the story to
that place through the existing related-object relationship. The place panorama
remains owned by the civic place; a story-owned panorama is a separate
`panoramas` row with `civic_object_type = 'civic_story'`.

## 9. Relationship to Production Units
When a story is published (CITY_ADMIN_WORKFLOW.md §11.4), a production_units row is created automatically. The Story Page consumes the production_unit for:

Content tier badge (§4.3) — production_units.content_tier.

Production attribution (when story_page_settings.show_production_attribution = true) — displays content tier and a publication transparency note. Off by default.

The Story Page never surfaces gross_cost, contributor_payout, editor_payout, net_city_cost, or any payout detail publicly. These are internal financial fields (RATE_CARD.md §3).

### 9.1 production_unit_id FK
civic_stories does not currently carry a production_unit_id FK column in DATA_MODEL.md §3. `production_units` carries `story_id → civic_stories.id` (DATA_MODEL.md §3). The Story Page resolves `content_tier` via reverse join:

```sql
SELECT content_tier
FROM   production_units
WHERE  story_id = :civic_story_id
LIMIT  1;

## 10. City Admin Workflow — Story Page Configuration
City Admins access Story Page settings from the Publication Queue or from the Object Manager's story list:

Publication Queue → [Published story] → Page Settings tab
  OR
Object Manager → [Civic object] → Related Stories → [Story] → Page Settings tab

Available actions:

Toggle section visibility: related stories, sponsor bar, production attribution

Toggle inline 360° viewer embeds (enable_inline_360)

Add captions to individual inline 360° embeds (inline_360_captions.{index})

Override SEO title (max 70 chars) and meta description (max 160 chars)

Upload a custom OG image

Enable / disable VR button (only has effect when a primary published story panorama exists)

Enable AR button (gated behind global AR launch flag)

Set canonical URL (CEO authorization required for cross-city)

## 11. Audit Log Wiring
All story_page_settings mutations are written to admin_action_logs.

domain       = 'editorial'
entity_type  = 'story_page_settings'
entity_id    = story_page_settings.id
action       = 'story_page_settings_edited'
metadata     = { changed_fields: { field: { old, new } } }
story_page_settings_edited under domain = 'editorial' is defined in CITY_ADMIN_WORKFLOW.md
and DATA_MODEL.md §14.3.

action	domain	entity_type	Trigger
story_published	editorial	civic_stories	Story published (existing)
story_unpublished	editorial	civic_stories	Story unpublished (existing)
safety_hold_placed	safety	civic_stories	safety_hold → true (existing)
safety_hold_lifted	safety	civic_stories	safety_hold → false (existing)
story_page_settings_edited	editorial	story_page_settings	Any page settings field changed


## 12. Future-Proofing Notes
### 12.1 Unity Story Reader
The Electrum Unity client renders Story Pages as a StoryReaderPanel — a scrollable Unity UI canvas:

StoryHeroViewer.cs — loads the primary published story panorama and its initial heading.

StoryBodyRenderer.cs — parses rich text and renders styled text blocks.

InlineViewer360.cs — temporary compatibility reader for existing inline_360_urls
values; new 360° uploads use panoramas rows.

LinkedObjectCardList.cs — renders linked civic object cards; tapping navigates to the Unity Object Page scene for that object.

RelatedStoryCardList.cs — renders related story cards in a scrollable Unity UI strip.

### 12.2 Audio narration (future)
story_page_settings reserves the key enable_audio_narration (boolean, default false) for a future feature where story body text is narrated by a TTS engine. When shipped, the narration audio URL would be stored in story_page_settings.audio_narration_url and played via a playback bar above the story body. No schema change required beyond adding those two columns.

### 12.3 Multilingual stories (future)
When multilingual expansion ships, civic_stories gains a locale column. Story Page routing becomes /stories/[slug] for the default locale and /[locale]/stories/[slug] for alternates. story_page_settings gains a locale_overrides JSONB column for per-locale SEO overrides. No structural change to the rest of this document is required.

### 12.4 Cross-city story links
civic_stories.cross_city_links (ARRAY) is an existing column intended for future cross-city narrative arcs. The Story Page does not render it in v1. When it ships, cross_city_links entries will render as a "This story connects to" card strip referencing objects or stories in other cities. The canonical_url in story_page_settings handles the SEO implications of cross-city linking.
