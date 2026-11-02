# PANORAMA_MODEL.md
Electrum — Panorama Data Model
Compatibility: DATA_MODEL.md · HOTSPOT_MODEL.md · HOTSPOT_WORKFLOW.md · CITY_ADMIN_WORKFLOW.md
Last updated: 2026-10-09

## 1. Purpose & Scope
A panorama is a 360° media asset bound to a civic object. It is the rendering surface for the Electrum immersive viewer and the container into which hotspots are placed. A civic object may have multiple panoramas (e.g., an exterior view and an interior view), ordered by display_order. The panorama with the lowest display_order and status = 'published' is the primary panorama rendered by default on the Object Page.

This document defines:

The panoramas table schema, field semantics, and constraints

pan_x_initial / pan_y_initial — normalized UV initial camera heading

Lifecycle states and transitions

Relationship to hotspots, civic object tables, and hero_360_url

RLS policies aligned to DATA_MODEL.md §7

Triggers

City Admin upload workflow

Audit log wiring

Unity / VR / AR future-proofing fields

## 2. Initial Camera Heading — pan_x_initial / pan_y_initial
The initial camera heading defines where the viewer faces when the panorama first loads. It uses the same normalized UV coordinate system as hotspot positions (HOTSPOT_MODEL.md §2):

Field	Range	Meaning
pan_x_initial	0.0 – 1.0	Horizontal heading. 0.5 = the centre of the equirectangular image (forward-facing seam). 0.0 = left edge. 1.0 = right edge.
pan_y_initial	0.0 – 1.0	Vertical heading. 0.5 = horizon. 0.0 = straight up (zenith). 1.0 = straight down (nadir).


Default: pan_x_initial = 0.5, pan_y_initial = 0.5 — viewer opens facing the image centre at the horizon.

City Admin adjusts these in the Panorama Editor using a Set Initial View control: the City Admin navigates the preview viewer to the desired heading and clicks "Set as initial view." The current viewer position converts to (pan_x_initial, pan_y_initial) using the same formula as hotspot placement.

Viewer conversion (for reference; not stored):

Code


Copy
pan_x_initial = yaw   / 360.0 + 0.5     // from equirectangular yaw (−180 to +180)
pan_y_initial = 0.5   − pitch / 180.0   // from equirectangular pitch (+90 to −90)

## 3. Schema Definition
sql


Copy
CREATE TABLE panoramas (
  -- ── Identity ──────────────────────────────────────────────────────────────
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id             UUID         NOT NULL REFERENCES cities(id),

  -- ── Polymorphic parent (the civic object this panorama belongs to) ─────────
  civic_object_id     UUID         NOT NULL,
  civic_object_type   TEXT         NOT NULL CHECK (civic_object_type IN (
                                     'civic_entity',
                                     'civic_event',
                                     'civic_place',
                                     'civic_moment',
                                     'civic_artifact',
                                     'civic_neighborhood'
                                   )),

  -- ── Media ─────────────────────────────────────────────────────────────────
  -- CDN URL in the universal-media bucket. Must be 2:1 aspect ratio.
  equirectangular_url TEXT         NOT NULL,
  thumbnail_url       TEXT,

  -- ── Display ───────────────────────────────────────────────────────────────
  label               TEXT         NOT NULL CHECK (char_length(label) BETWEEN 1 AND 120),
  description         TEXT         CHECK (char_length(description) <= 500),
  display_order       INTEGER      NOT NULL DEFAULT 0,

  -- ── Initial camera heading (normalized UV, viewer-agnostic) ───────────────
  pan_x_initial       NUMERIC(5,4) NOT NULL DEFAULT 0.5
                        CHECK (pan_x_initial BETWEEN 0 AND 1),
  pan_y_initial       NUMERIC(5,4) NOT NULL DEFAULT 0.5
                        CHECK (pan_y_initial BETWEEN 0 AND 1),

  -- ── Capture attribution ───────────────────────────────────────────────────
  capture_date        DATE,
  capture_attribution TEXT,

  -- ── Lifecycle ─────────────────────────────────────────────────────────────
  -- Mirrors the civic content lifecycle pattern (DATA_MODEL.md §1).
  status              TEXT         NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'archived')),
  is_published        BOOLEAN      NOT NULL DEFAULT false,
  published_at        TIMESTAMPTZ,
  published_by        UUID         REFERENCES admin_users(id),
  archived_at         TIMESTAMPTZ,
  archived_by         UUID         REFERENCES admin_users(id),

  -- ── Extension bag ─────────────────────────────────────────────────────────
  -- For Unity scene IDs, spatial anchor IDs, VR comfort level,
  -- ambient audio, and any future immersive-media fields.
  metadata            JSONB        NOT NULL DEFAULT '{}',

  -- ── Admin / audit ─────────────────────────────────────────────────────────
  created_by          UUID         REFERENCES admin_users(id),
  updated_by          UUID         REFERENCES admin_users(id),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

## 4. Field Reference
Column	Type	Required	Default	Notes
id	UUID	Yes	gen_random_uuid()	Primary key
city_id	UUID	Yes	—	FK → cities.id; enforced by trigger
civic_object_id	UUID	Yes	—	Polymorphic FK to the parent civic_* table
civic_object_type	TEXT	Yes	—	Discriminator; determines which civic_* table to resolve
equirectangular_url	TEXT	Yes	—	CDN URL; 2:1 aspect ratio required
thumbnail_url	TEXT	No	NULL	Flat preview; auto-generated on upload
label	TEXT	Yes	—	1–120 chars
description	TEXT	No	NULL	Max 500 chars; shown in the panorama carousel on Object Page
display_order	INTEGER	Yes	0	Lower = shown first; primary panorama = lowest published order
pan_x_initial	NUMERIC(5,4)	Yes	0.5	Horizontal initial heading; 0.0 = left, 1.0 = right
pan_y_initial	NUMERIC(5,4)	Yes	0.5	Vertical initial heading; 0.0 = up, 1.0 = down
capture_date	DATE	No	NULL	Date of the 360° capture
capture_attribution	TEXT	No	NULL	Photographer / agency credit; displayed on Object Page
status	TEXT	Yes	'draft'	'draft' \	'published' \	'archived'
is_published	BOOLEAN	Yes	false	true when status = 'published'; kept for query parity with civic tables
published_at	TIMESTAMPTZ	No	NULL	Set by trigger on publish
published_by	UUID	No	NULL	admin_users.id of publisher
archived_at	TIMESTAMPTZ	No	NULL	Set by trigger on archive
archived_by	UUID	No	NULL	admin_users.id of archiver
metadata	JSONB	Yes	{}	Extension bag; see §5
created_by	UUID	No	NULL	FK → admin_users.id
updated_by	UUID	No	NULL	FK → admin_users.id
created_at	TIMESTAMPTZ	Yes	NOW()	Auto
updated_at	TIMESTAMPTZ	Yes	NOW()	Auto-updated by trigger


## 5. metadata JSONB — Reserved Keys
metadata is the extension bag for immersive-media fields that are not yet stable enough for dedicated columns. Consumers must handle missing keys gracefully.

jsonc


Copy
{
  // Unity
  "unity_scene_id":    "uuid-or-asset-key",   // Pre-built Unity scene bundle reference
  "vr_comfort_level":  "seated",              // "seated" | "standing" | "room_scale"

  // AR
  "spatial_anchor_id": "azure-anchor-id",     // Azure Spatial Anchor cloud ID for AR placement

  // Audio
  "ambient_audio_url": "https://cdn.../audio.mp3",  // Spatial audio for VR/immersive view

  // Media detail
  "media_type":        "image",               // "image" | "video"
  "video_source_url":  null,                  // Original source URL for video panoramas

  // Processing
  "processing_job_id": "uuid"                 // CDN ingestion job reference
}

## 6. Lifecycle
Code


Copy
draft ──────────────────────► published ──────────────────────► archived
  ▲                               │
  └───────── unpublish ───────────┘
             (status → draft; is_published → false)

Re-publishing from archived is NOT permitted.
Create a new panorama row instead.
Transition	Who	System effects
draft → published	City Admin	status = 'published', is_published = true, published_at = NOW(), published_by = admin_id; hotspots with is_active = true become visible to anon
published → draft	City Admin	status = 'draft', is_published = false; hotspots remain but are hidden (RLS public read requires status = 'published' on parent panorama)
published → archived	City Admin	status = 'archived', is_published = false, archived_at = NOW(), archived_by = admin_id; triggers cascade deactivation of all child hotspots
draft → archived	City Admin	Discard an unwanted draft; no hotspot cascade (draft panoramas have no active hotspots)


## 7. Triggers
### 7.1 Validate city_id against parent civic object
Prevents a panorama from being bound to a civic object in a different city.

sql


Copy
CREATE OR REPLACE FUNCTION panorama_validate_city()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_city_id UUID;
BEGIN
  EXECUTE format(
    'SELECT city_id FROM %I WHERE id = $1',
    NEW.civic_object_type
  ) INTO v_city_id USING NEW.civic_object_id;

  IF v_city_id IS NULL OR v_city_id <> NEW.city_id THEN
    RAISE EXCEPTION
      'panorama city_id (%) does not match civic object city_id (%)',
      NEW.city_id, v_city_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_panorama_validate_city
  BEFORE INSERT OR UPDATE OF civic_object_id, city_id ON panoramas
  FOR EACH ROW EXECUTE FUNCTION panorama_validate_city();

### 7.2 Sync status → is_published and set timestamps
sql


Copy
CREATE OR REPLACE FUNCTION panorama_sync_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    NEW.is_published  := true;
    NEW.published_at  := NOW();
    NEW.published_by  := (
      SELECT id FROM admin_users WHERE auth_uid = auth.uid()::text LIMIT 1
    );
  ELSIF NEW.status IN ('draft', 'archived') AND OLD.status = 'published' THEN
    NEW.is_published := false;
  END IF;

  IF NEW.status = 'archived' AND OLD.status <> 'archived' THEN
    NEW.archived_at := NOW();
    NEW.archived_by := (
      SELECT id FROM admin_users WHERE auth_uid = auth.uid()::text LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_panorama_sync_status
  BEFORE UPDATE OF status ON panoramas
  FOR EACH ROW EXECUTE FUNCTION panorama_sync_status();

### 7.3 Cascade: deactivate hotspots on archive
sql


Copy
CREATE OR REPLACE FUNCTION panorama_archive_cascade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'archived' AND OLD.status <> 'archived' THEN
    UPDATE hotspots
    SET    is_active  = false,
           updated_at = NOW()
    WHERE  panorama_id = NEW.id
      AND  is_active   = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_panorama_archive_cascade
  AFTER UPDATE OF status ON panoramas
  FOR EACH ROW EXECUTE FUNCTION panorama_archive_cascade();

### 7.4 Auto-update updated_at
sql


Copy
CREATE TRIGGER trg_panorama_updated_at
  BEFORE UPDATE ON panoramas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

## 8. RLS Policies
Follows the canonical pattern from DATA_MODEL.md §7.

sql


Copy
ALTER TABLE panoramas ENABLE ROW LEVEL SECURITY;

-- Public: published panoramas only
CREATE POLICY panoramas_anon_read ON public.panoramas
  FOR SELECT TO anon
  USING (status = 'published');

-- City Admin + CEO: full CRUD, city-scoped
CREATE POLICY panoramas_admin ON public.panoramas
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
Access summary

Role	SELECT	INSERT	UPDATE	DELETE
anon	Published only	✗	✗	✗
city_admin	All statuses, own cities	Own cities	Own cities	Own cities
ceo	All	All	All	All
contributor	✗	✗	✗	✗


## 9. Indexes
sql


Copy
-- Primary viewer lookup: all panoramas for a civic object
CREATE INDEX idx_panoramas_civic_object
  ON panoramas (civic_object_id, civic_object_type, display_order);

-- RLS fast path: city-scoped admin queries
CREATE INDEX idx_panoramas_city_id
  ON panoramas (city_id);

-- Public read path: published panoramas only
CREATE INDEX idx_panoramas_published
  ON panoramas (civic_object_id, display_order)
  WHERE status = 'published';

## 10. Relationships
Code


Copy
cities (1)
  └── (N) civic_* objects
                └── (N) panoramas
                              └── (N) hotspots
city_id → cities.id

civic_object_id → the appropriate civic_* table, resolved by civic_object_type. No DB-level FK (target table varies). Integrity enforced by trg_panorama_validate_city (§7.1).

panoramas.id → hotspots.panorama_id (1 → N; CASCADE DELETE on panorama row removal)

created_by / updated_by / published_by / archived_by → admin_users.id

### 10.1 Relationship to hero_360_url
civic_* tables carry a hero_360_url field used by the civic object approval gate (CITY_ADMIN_WORKFLOW.md §3.3 and §10.4). panoramas is the canonical, richer representation.

hero_360_url on a civic object should reference the equirectangular_url of the primary published panorama.

When a panorama is published with display_order = 0, the trg_panorama_sync_hero_360 trigger (implementation TBD) auto-populates hero_360_url on the parent civic object.

Do not maintain hero_360_url manually for civic objects that have associated panoramas rows.

## 11. Audit Log Entries
All panorama mutations are written to admin_action_logs with domain = 'navigation'.

Code


Copy
actor_user_id   →  auth.users.id
actor_admin_id  →  admin_users.id
actor_role      →  'city_admin' or 'ceo'
domain          →  'navigation'
entity_type     →  'panoramas'
entity_id       →  panoramas.id
action	Trigger	Key metadata fields
panorama_created	Upload complete; row inserted	civic_object_id, civic_object_type, label, equirectangular_url
panorama_published	status → 'published'	civic_object_id, display_order
panorama_unpublished	status → 'draft'	civic_object_id
panorama_archived	status → 'archived'	civic_object_id, hotspots_deactivated_count
panorama_reordered	display_order changed	old_order, new_order
panorama_metadata_edited	Any other field updated	changed_fields: {field: {old, new}}


These extend the navigation domain row in CITY_ADMIN_WORKFLOW.md §14.5:

Navigation — navigation_item_created, navigation_item_updated, navigation_item_deleted, hotspot_placed, hotspot_updated, hotspot_activated, hotspot_deactivated, hotspot_deleted, panorama_created, panorama_published, panorama_unpublished, panorama_archived, panorama_reordered, panorama_metadata_edited

## 12. City Admin Upload Workflow
### 12.1 Access path
Code


Copy
Object Manager → [Approved civic object] → Panoramas tab → + Add Panorama
The Panoramas tab is available on any civic object with status = 'approved'.

### 12.2 Upload steps
City Admin clicks + Add Panorama.

File picker opens. Accepted formats:

Image: JPG or PNG, minimum 4096 × 2048 px, max 50 MB, aspect ratio 2:1 ± 5%

Video: MP4, max 2 GB (video panoramas stored with metadata.media_type = 'video')

File uploads to universal-media/cities/<cityId>/panoramas/.

CDN ingestion job runs asynchronously:

equirectangular_url populated on completion.

thumbnail_url auto-generated at 1200 × 600 px.

City Admin completes metadata:

Label (required)

Description (optional)

Capture date and Capture attribution (optional)

Initial camera heading — via Set Initial View control in the preview viewer (see §2)

Display order (integer input; default = next after existing panoramas)

VR comfort level (metadata.vr_comfort_level, select: seated / standing / room_scale)

Ambient audio (optional file upload → metadata.ambient_audio_url)

City Admin clicks Save → row inserted with status = 'draft', is_published = false.

City Admin previews in the 360° viewer and adjusts the initial heading if needed.

City Admin clicks Publish → status → 'published', is_published → true. Hotspot Editor tab becomes available.

### 12.3 Primary panorama
The primary panorama for a civic object is the published panorama with the lowest display_order. City Admin may reorder panoramas via drag-and-drop in the Panoramas tab. The Object Page viewer loads the primary panorama on initial render.

## 13. GRANT
sql

GRANT SELECT ON public.panoramas TO anon;

## 14. Future-Proofing Notes
### 14.1 Unity scene assets (metadata.unity_scene_id)
When populated, the Unity client loads the referenced scene bundle from the CDN asset registry instead of rendering a plain textured sphere. The scene may include geometry, lighting bakes, and interactable objects.

### 14.2 Azure Spatial Anchors (metadata.spatial_anchor_id)
The Electrum AR app uses this to overlay the panorama at the civic object's physical real-world location. Anchor provisioning is external (Azure portal / AR SDK); the ID is entered by the City Admin or populated via an AR provisioning API.

### 14.3 Video panoramas (metadata.media_type = 'video')
The viewer renders video panoramas using a <video> element mapped to a WebGL sphere. Hotspots on video panoramas are temporally fixed in v1; per-frame hotspot timing is a future capability tracked via metadata.hotspot_timing.