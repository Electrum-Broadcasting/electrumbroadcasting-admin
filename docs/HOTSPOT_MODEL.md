# HOTSPOT_MODEL.md
Electrum — Hotspot Data Model
Compatibility: DATA_MODEL.md · PANORAMA_MODEL.md · HOTSPOT_WORKFLOW.md
Last updated: 2026-10-09

## 1. Purpose & Scope
A hotspot is a spatial marker anchored to a source equirectangular panorama. It records normalized source-panorama UV coordinates and a link to a civic object, a story, another panorama, or an external URL. The viewer projects those stored coordinates into viewer space based on the current camera orientation; stored coordinates are not viewport or screen-pixel coordinates.

Hotspots are relationships — they sit between a panoramas row (the image) and a target record (an object, story, or URL). They are not standalone content; they derive meaning from both sides of that relationship.

This document defines:

The hotspots table schema, field semantics, and constraints

The pan_x / pan_y UV-space coordinate system

Relationships to panoramas, civic tables, and civic_stories

RLS policies aligned to DATA_MODEL.md §7 patterns

Triggers and integrity rules

Audit log wiring (admin_action_logs)

DATA_MODEL.md §14.3 additions for the navigation domain

Viewer behavior is governed by IMMERSIVE_EXPERIENCE_VISION.md. WebXR is Intended Behavior;
Unity integration is a Future Possibility, not approved implementation scope. Reserved behavior
fields do not establish an implementation requirement.
Specification authority is: IMMERSIVE_EXPERIENCE_VISION.md > OBJECT_PAGE_MODEL.md >
PANORAMA_MODEL.md > HOTSPOT_MODEL.md > HOTSPOT_WORKFLOW.md.

## 2. Coordinate System — pan_x / pan_y
Hotspot positions are stored as normalized UV coordinates on the source equirectangular panorama.
The values identify source-image positions and are not coordinates in the viewport or on the
screen.

Axis	Range	Meaning
pan_x	0.0 – 1.0	Horizontal position. 0.0 = left edge, 1.0 = right edge, 0.5 = centre
pan_y	0.0 – 1.0	Vertical position. 0.0 = top edge, 1.0 = bottom edge, 0.5 = horizon


Why normalized UV?

Viewer-independent storage: the source UV values remain stable across viewers, while each viewer
must project them from the panorama into its camera/view space.

Placement is not a direct mapping from pointer position or viewer bounds to (pan_x, pan_y).
Placement must convert the viewer interaction to a camera ray, intersect that ray with the
panorama sphere, and map the resulting source direction to equirectangular UV coordinates.
Dragging/repositioning uses the same projection path.

Simple to interpolate, animate, and debug.

Does not encode any viewer-specific math model (e.g., yaw/pitch degrees, equirectangular radians).

Viewer conversion formulas (for reference; not stored in the database):

// Normalized UV → equirectangular angles
yaw   = (pan_x - 0.5) * 360.0   // degrees: -180 to +180
pitch = (0.5 - pan_y) * 180.0   // degrees: +90 (top) to -90 (bottom)

// Equirectangular angles → normalized UV
pan_x = yaw   / 360.0 + 0.5
pan_y = 0.5   - pitch / 180.0

// Normalized UV → Three.js spherical (radians)
theta = pan_x * 2 * Math.PI     // azimuth
phi   = pan_y * Math.PI         // polar angle from top
These conversions live in the viewer layer, not in application data. They describe mapping
between source UV and spherical direction; they do not mean that UV equals the current on-screen
position.

### 2.1 Navigation semantics
Resolve the hotspot action by target type:

| Target type | Navigation behavior |
|---|---|
| Civic object | Navigate to that object's Object Page. |
| `civic_story` | Navigate to the Story Page. |
| `panorama` | Remain within the immersive viewer and load the destination panorama while preserving curatorial context. Seamless 0.6-second exposure-style cross-fading is Intended Behavior. |
| `external_url` | Leave the Atlas intentionally; open the external destination in a new tab. |

### 2.2 Viewer behavior and feature state
Intended viewer behavior/acceptance criteria are auto-rotation at 3°/second, pitch lock at +14°
and -14°, drag interaction, compass awareness, camera-aware hotspot positioning, viewport
clipping, and yielding auto-rotation to user interaction. The authoritative vision classifies
the panorama canvas and normalized UV hotspots as Current Implementation; this specification
records their required behavior without changing that status. Seamless panorama cross-fading and
spatial audio are Intended Behavior. WebXR/headset mode is Intended Behavior; Unity integration
is a Future Possibility and is not approved implementation scope.

## 3. Schema Definition

CREATE TABLE hotspots (
  -- ── Identity ────────────────────────────────────────────────────────────────
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  panorama_id       UUID         NOT NULL REFERENCES panoramas(id) ON DELETE CASCADE,
  city_id           UUID         NOT NULL REFERENCES cities(id),

  -- ── Position (UV-space, viewer-agnostic) ────────────────────────────────────
  -- 0.0 = left/top edge; 1.0 = right/bottom edge; 0.5 = centre/horizon
  pan_x             NUMERIC(5,4) NOT NULL CHECK (pan_x BETWEEN 0 AND 1),
  pan_y             NUMERIC(5,4) NOT NULL CHECK (pan_y BETWEEN 0 AND 1),

  -- ── Link target (mutually exclusive; enforced by CHECK below) ────────────────
  -- target_type discriminates the polymorphic FK
  target_type       TEXT         NOT NULL CHECK (target_type IN (
                                   'civic_entity',
                                   'civic_event',
                                   'civic_place',
                                   'civic_moment',
                                   'civic_artifact',
                                   'civic_neighborhood',
                                   'civic_story',
                                   'panorama',
                                   'external_url'
                                 )),
  -- FK to the appropriate civic_* table, civic_stories, or panoramas.
  -- NULL when target_type = 'external_url'.
  target_id         UUID,

  -- Populated only when target_type = 'external_url'. NULL otherwise.
  target_url        TEXT,

  -- ── Display ─────────────────────────────────────────────────────────────────
  label             TEXT         NOT NULL CHECK (char_length(label) BETWEEN 1 AND 120),
  icon              TEXT         NOT NULL DEFAULT 'default',

  -- ── Visibility & ordering ───────────────────────────────────────────────────
  is_active         BOOLEAN      NOT NULL DEFAULT false,
  display_order     INTEGER      NOT NULL DEFAULT 0,

  -- ── Extension bags ──────────────────────────────────────────────────────────
  -- metadata: caption, attribution, short_description, or any future display field.
  metadata          JSONB        NOT NULL DEFAULT '{}',
  -- behavior: viewer-specific or VR-specific runtime hints.
  behavior          JSONB        NOT NULL DEFAULT '{}',

  -- ── Admin / audit ───────────────────────────────────────────────────────────
  created_by        UUID         REFERENCES admin_users(id),
  updated_by        UUID         REFERENCES admin_users(id),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- ── Integrity constraints ────────────────────────────────────────────────────
  -- Exactly one target: target_id XOR target_url, never both, never neither.
  CONSTRAINT hotspot_target_exclusive CHECK (
    (
      target_type IN (
        'civic_entity', 'civic_event', 'civic_place', 'civic_moment',
        'civic_artifact', 'civic_neighborhood', 'civic_story', 'panorama'
      )
      AND target_id  IS NOT NULL
      AND target_url IS NULL
    )
    OR
    (
      target_type = 'external_url'
      AND target_url IS NOT NULL
      AND target_id  IS NULL
    )
  )
);

## 4. Field Reference
Column	Type	Required	Default	Notes
id	UUID	Yes	gen_random_uuid()	Primary key
panorama_id	UUID	Yes	—	FK → panoramas(id); CASCADE DELETE
city_id	UUID	Yes	—	Denormalised for RLS; auto-set by trigger
pan_x	NUMERIC(5,4)	Yes	—	Horizontal UV position, 0.0–1.0
pan_y	NUMERIC(5,4)	Yes	—	Vertical UV position, 0.0–1.0
target_type	TEXT	Yes	—	Polymorphic discriminator
target_id	UUID	Conditional	NULL	Required when target_type ≠ 'external_url'
target_url	TEXT	Conditional	NULL	Required when target_type = 'external_url'
label	TEXT	Yes	—	1–120 chars; hotspot callout title
icon	TEXT	Yes	'default'	Icon key from design system
is_active	BOOLEAN	Yes	false	false = hidden; saved inactive by default
display_order	INTEGER	Yes	0	Rendering order within panorama
metadata	JSONB	Yes	{}	Optional display fields (caption, attribution, short_description)
behavior	JSONB	Yes	{}	Viewer/VR runtime hints
created_by	UUID	No	NULL	FK → admin_users(id)
updated_by	UUID	No	NULL	FK → admin_users(id)
created_at	TIMESTAMPTZ	Yes	NOW()	Auto
updated_at	TIMESTAMPTZ	Yes	NOW()	Auto-updated by trigger


## 5. target_type Values
target_type	target_id resolves to	target_url
civic_entity	civic_entities.id	NULL
civic_event	civic_events.id	NULL
civic_place	civic_places.id	NULL
civic_moment	civic_moments.id	NULL
civic_artifact	civic_artifacts.id	NULL
civic_neighborhood	civic_neighborhoods.id	NULL
civic_story	civic_stories.id	NULL
panorama	panoramas.id	NULL
external_url	NULL	Absolute https:// URL


Target IDs have no polymorphic FK. The hotspot integrity trigger checks existence
and city on target changes and publication on activation; the M9B service uses
the public-page eligibility contract in HOTSPOT_WORKFLOW.md §5 before saving or
activating. Eligibility does not establish that the public page can be served.

## 6. Relationships

panoramas (1)
  └── (N) hotspots
              │
    ┌─────────┼───────────────────────────────┐
    ▼         ▼                               ▼
civic_*    civic_stories             panoramas (nav target)
tables     (review_status            (status = 'published')
            = 'published')
panorama_id → panoramas.id — CASCADE DELETE. Deleting a panorama removes all its hotspots.

city_id → cities.id — Denormalised. Auto-populated from the parent panorama by trigger (§7.1). Ensures RLS city-scoping without a join.

target_id (polymorphic) — Civic objects and Stories must meet the public-page
eligibility contract in HOTSPOT_WORKFLOW.md §5. Panorama targets are deferred.
The hotspot service checks this contract; the database trigger enforces a subset.

created_by / updated_by → admin_users.id.

## 7. Triggers
### 7.1 Auto-populate city_id from parent panorama

CREATE OR REPLACE FUNCTION hotspot_set_city_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT city_id INTO NEW.city_id
  FROM panoramas
  WHERE id = NEW.panorama_id;

  IF NEW.city_id IS NULL THEN
    RAISE EXCEPTION
      'hotspot.panorama_id % not found or has no city_id', NEW.panorama_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hotspot_set_city_id
  BEFORE INSERT OR UPDATE OF panorama_id ON hotspots
  FOR EACH ROW EXECUTE FUNCTION hotspot_set_city_id();

### 7.2 Auto-update updated_at

CREATE TRIGGER trg_hotspot_updated_at
  BEFORE UPDATE ON hotspots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

## 8. RLS Policies
Follows the canonical pattern from DATA_MODEL.md §7.

ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;

-- ── Public: active hotspots on published panoramas only ──────────────────────
CREATE POLICY hotspots_anon_read ON public.hotspots
  FOR SELECT TO anon
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM panoramas p
      WHERE p.id = hotspots.panorama_id
        AND p.status = 'published'
    )
  );

-- ── City Admin + CEO: full CRUD, city-scoped ─────────────────────────────────
CREATE POLICY hotspots_admin ON public.hotspots
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids)
      FROM admin_users
      WHERE auth_uid = auth.uid()::text
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids)
      FROM admin_users
      WHERE auth_uid = auth.uid()::text
    )
  );
Access summary

Role	SELECT	INSERT	UPDATE	DELETE
anon	Active hotspots on published panoramas only	✗	✗	✗
city_admin	All hotspots in own cities	Own cities	Own cities	Own cities
ceo	All	All	All	All
contributor	✗	✗	✗	✗


## 9. Indexes

-- Primary viewer lookup: all hotspots for a panorama
CREATE INDEX idx_hotspots_panorama_id
  ON hotspots (panorama_id);

-- RLS fast path: city-scoped admin queries
CREATE INDEX idx_hotspots_city_id
  ON hotspots (city_id);

-- Public read path: active hotspots only
CREATE INDEX idx_hotspots_active
  ON hotspots (panorama_id, display_order)
  WHERE is_active = true;

-- Reverse traversal: "which hotspots link to this object?"
CREATE INDEX idx_hotspots_target
  ON hotspots (target_type, target_id)
  WHERE target_id IS NOT NULL;

## 10. Audit Log Wiring
All hotspot mutations are written to admin_action_logs. The table has no domain column — domain is a conceptual grouping from DATA_MODEL.md §14.3 and is encoded in metadata.domain.

-- admin_action_logs schema (DATA_MODEL.md §10.1):
-- id, actor_user_id, action, entity_type, entity_id, metadata, created_at

INSERT INTO admin_action_logs
  (actor_user_id, action, entity_type, entity_id, metadata)
VALUES
  (auth.uid(), '<action>', 'hotspots', <hotspot_id>, '<metadata_jsonb>');
10.1 Canonical action strings (additions to DATA_MODEL.md §14.3, navigation domain)
action	Trigger	metadata keys
hotspot_placed	New hotspot created	panorama_id, target_type, target_id, pan_x, pan_y, label, domain: 'navigation'
hotspot_updated	Any field edited	changed_fields: {field: {old, new}}, domain: 'navigation'
hotspot_activated	is_active → true	panorama_id, domain: 'navigation'
hotspot_deactivated	is_active → false	panorama_id, domain: 'navigation'
hotspot_deleted	Row deleted	panorama_id, target_type, target_id, reason, domain: 'navigation'


These extend the navigation domain row in DATA_MODEL.md §14.3:

navigation — navigation_item_created, navigation_item_updated, navigation_item_deleted, hotspot_placed, hotspot_updated, hotspot_activated, hotspot_deactivated, hotspot_deleted

## 11. metadata JSONB — Recommended Keys
metadata is open-ended. The following keys are conventional and should be used where applicable:

jsonc

{
  "short_description": "The 1906 earthquake epicentre marker",  // shown in callout card
  "caption":           "Photo: SFPL Archives, 1906",           // image credit
  "attribution":       "San Francisco Public Library",
  "cta_label":         "Explore City Hall"                      // overrides default CTA text
}
Consumers must handle missing keys gracefully.

## 12. behavior JSONB — Reserved Keys
behavior carries advisory viewer-layer and future immersive-runtime hints. Consumers must handle
missing keys with sensible defaults. The presence of a key does not require implementing the
associated capability.

jsonc

{
  // Web viewer
  "auto_open":        false,        // open callout card on panorama load without user click
  "open_delay_ms":    0,            // ms delay before auto_open fires

  // Future immersive-runtime hints; not a current implementation commitment
  "linger_ms":        1500,         // gaze dwell duration before auto-trigger (VR)
  "haptic_preset":    "soft",       // "soft" | "medium" | "strong"
  "animation":        "pulse",      // entrance animation: "pulse" | "beacon" | "static" | "orbit"
  "label_billboard":  true,         // keep label facing the camera in 3D space

  // Visibility clipping (UV-space)
  "hide_above_pan_y": 0.15,         // hide when viewer looks too far up
  "hide_below_pan_y": 0.85          // hide when viewer looks too far down
}
Future Possibility — Unity-specific precomputed world positions are not approved implementation
scope. If a future Unity phase requires them, it may use a representation such as:

jsonc

{
  "world_position": { "x": 0.0, "y": 1.6, "z": -5.0 },
  "interaction_radius": 0.35
}
These keys live in behavior, not in dedicated columns, keeping the schema stable as VR requirements evolve.

## 13. Anon GRANT

GRANT SELECT ON public.hotspots TO anon;

## 14. Checklist for HOTSPOT_MODEL.md Consumers
[ ] Read pan_x/pan_y as normalized floats 0–1, not degrees or radians

[ ] Convert to viewer coordinates in the viewer layer using the formulas in §2

[ ] Always filter is_active = true and verify parent panorama status = 'published' before serving to anon

[ ] Validate target eligibility through the hotspot service before activation

[ ] Encode metadata.domain = 'navigation' in every admin_action_logs write

[ ] Treat Unity/VR world-space overrides in behavior.world_position as a Future Possibility, not an implementation requirement