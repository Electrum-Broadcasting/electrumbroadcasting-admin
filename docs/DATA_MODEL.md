DATA-MODEL.md 
Electrum’s data model is a city centric relational schema built on Supabase/PostgreSQL with strict Row Level Security (RLS). This document describes all core tables, relationships, foreign keys, and usage patterns.
It is designed for both human contributors and AI agents (Copilot, Workspace) to understand the database structure and enforce consistent, RLS safe access patterns.

## 1. Core Concepts

Electrum organizes civic memory around cities, each of which defines its own branding, design system, feature toggles, navigation, prompts, and safety settings. All public content is scoped by city_id, and all public queries must respect RLS using the anon role.
Electrum’s civic model is built on a consistent pattern shared across all civic content tables:
•	id — UUID primary key
•	city_id — UUID FK → cities.id
•	slug — stable public identifier
•	title — human-readable name
•	description — long-form narrative or metadata
•	created_at — timestamp

This pattern applies to all core civic tables, including civic_events, civic_eras, civic_stories, civic_places, civic_entities, civic_artifacts, civic_neighborhoods, and civic_moments.

Electrum’s relationship model is unified under civic_relationships and a small set of specialized join tables (e.g., event_eras, moment_entity_links). These tables define how civic content connects across time, place, people, and narrative.

Electrum’s public API, loaders, and admin UI all rely on this shared structure. Workspace uses this model to enforce consistency across modules, normalize Supabase access, and maintain architectural integrity during refactors.

Electrum’s civic memory around cities is further defined:
•	Brand identity (city_brand_settings)
•	Design system (city_design_system)
•	Modular pages (city_brand_settings + sections + blocks)
•	Civic content (events, eras, stories, places, entities, moments, artifacts, neighborhoods)

Electrum uses a draft/publish model for all city level configuration:
•	Draft → editable, previewable
•	Published → live on public UI

Preview mode loads draft. Public UI loads published.

## 2. Table Overview

Electrum’s schema is composed of the following major tables:

City Tables
•	cities
•	city_brand_settings
•	city_design_system
•	city_feature_toggles
•	city_prompts — AI integration table
•	city_safety_settings — optional / future
•	city_freeze_events — optional / future

Civic Content Tables
•	civic_artifacts
•	civic_entities
•	civic_events
•	civic_eras
•	civic_moments
•	civic_neighborhoods
•	civic_places
•	civic_stories

Relationship Tables
•	event_eras
•	civic_relationships
•	moment_entities
•	moment_eras 
•	moment_places 
•	moment_stories — optional / future
•	moment_neighborhoods — optional / future

Immersive Media Tables
•  	panoramas
•  	hotspots

Page Configuration Tables
•  	civic_object_page_settings
•  	story_page_settings

Sponsor Tables
•   	sponsors                    — base sponsor identity record
•   	sponsor_profiles            — extended profile; 1:1 with sponsors
•   	sponsorship_campaigns       — campaign lifecycle and pricing
•   	sponsorship_placements      — city/page-level placement slots
•   	creative_assets             — typed creative assets (image, text, logo, etc.)
•   	sponsor_allocations         — city budget contributions (see Admin Tables)
•   	ad_clicks                   — optional / not required for launch
•   	ad_impressions              — optional / not required for launch
•  	ad_slots                    — ⚠️ DEPRECATED; superseded by sponsorship_placements
•   	ad_creatives                — ⚠️ DEPRECATED; superseded by creative_assets

Admin Tables
•	admin_action_logs
•	admin_users 
•	contributors 
•	flag_events 
•	fraud_contributor_state 
•	fraud_rules 
•	fraud_signals 
•	global_brand_settings 
•	global_feature_toggles 
•	global_permissions 
•	global_safety_settings 
•	global_settings 
•	rate_limit_events
•	roles 
•	user_roles 
•	platform_settings 
•	profiles 
•	city_budget 
•	sponsor_allocations 
•	production_units 
•	payout_batches 
•	payout_batch_items 

AI Response Tables
•	ai_response_cache 
•	ai_usage_logs

Gaming Tables
•	game_answers
•	game_attempts
•	game_question_options
•	game_scores
•   	game_users
•	games

Search Tables
•	search_index

## 3. Core Table Schema Blocks

### 3.1 Table: cities
Primary table for all city-level content.
column_name	data_type
id	uuid
name	text
founded_year	integer
latitude	double precision
longitude	double precision
created_at	timestamp with time zone
updated_at	timestamp with time zone
incorporated_year	integer
slug	text
domain	text
state_province	text
country	text
status	text
electrum_year	integer
electrum_year_label	text
is_primary	boolean
primary_temporal_layer_id	Uuid
hero_image_url	Text
population	Int4

Relationships
•	1 → many with city_brand_settings (one row per publication status)
•	1 → many with city_design_system (one row per publication status)
•	1 → many with all civic tables
•	1 → many with modular pages
RLS
Anon must be able to SELECT.

Electrum’s public UI renders modular pages defined in Supabase.
Pages define:
•	the city’s modular page structure
•	the city’s civic memory architecture
•	the city’s public navigation
•	the city’s content hierarchy
These are brand level decisions, not design system decisions.

### 3.2 Table: city_brand_settings

Defines per city branding, colors, logos, and identity.
column_name	data_type
id	uuid
city_id	uuid
city_display_name	text
city_tagline	text
city_description	text
city_summary	text
hero_title	text
hero_subtitle	text
hero_cta_text	text
hero_cta_link	text
homepage_tagline	text
homepage_subtitle	text
homepage_description	text
homepage_summary	text
slideshow_asset_ids	uuid[]
timeline_title	text
timeline_description	text
timeline_og_title	text
timeline_og_description	text
timeline_canonical_url	text
navigation_items_json	jsonb
navigation_order_json	jsonb
navigation_cta_text	text
navigation_cta_link	text
navigation_logo_asset_id	uuid
navigation_logo_alt_text	text
explore_title	text
explore_subtitle	text
explore_bento_items_json	jsonb
explore_shelf_items_json	jsonb
explore_description	text
explore_summary	text
codex_title	text
codex_subtitle	text
codex_description	text
codex_summary	text
list_page_title	text
list_page_description	text
list_page_og_title	text
list_page_og_description	text
list_page_canonical_url	text
social_youtube	text
social_facebook	text
social_instagram	text
social_bluesky	text
logo	jsonb
crest_asset_path	text
favicon_32_asset_path	text
favicon_48_asset_path	text
apple_touch_icon_asset_path	text
app_icon_512_asset_path	text
accessibility_json	jsonb
child_safety_json	jsonb
created_at	timestamp with time zone
updated_at	timestamp with time zone
pages	Jsonb
Status	text

The public UI consumes the canonical row shape defined in `BRANDING_SCHEMA.md`.
The legacy `description`, `summary`, `accessibility`, and `child_safety` fields
remain available for existing admin workflows; public branding uses
`city_description`, `city_summary`, `accessibility_json`, and
`child_safety_json`.

### 3.3 Table: city_design_system

Defines per city design tokens used by the UI.
column_name	data_type
id	uuid
draft_theme	jsonb
updated_at	timestamp with time zone
published_theme	jsonb
city_id	Uuid
Status	text

`draft_theme` and `published_theme` use the Lovable theme shape in
`THEME_SCHEMA.md`. The public UI reads only `published_theme`.

### 3.4 Table: global_brand_settings

Global theme fallback and Electrum logo.

column_name	data_type
id	uuid
status	text
theme_json	jsonb
logo_asset_id	uuid
created_at	timestamp with time zone
updated_at	timestamp with time zone
updated_by	uuid

`theme_json` holds the full Lovable theme (see `THEME_SCHEMA.md`) and is the
global fallback when a city has no valid `published_theme`. `city_brand_settings`
stores content only and never holds theme tokens.

### 3.5 Table: civic_entities

Represents people, organizations, and identity based civic actors.
column_name	data_type
id	uuid
city_id	uuid
name	text
entity_type	text
roles	text
description	text
birth_year	integer
death_year	integer
created_at	timestamp with time zone
updated_at	timestamp with time zone
is_published	boolean
summary	text
slug	text
hero_image_url	text
hero_360_url	text
media_urls	ARRAY
tags	ARRAY
year	integer
era_id	uuid
thumbnail_url	text
ingestion_source	text
ingestion_metadata	jsonb
status	text
Ingestion columns (ingestion_source, ingestion_metadata, status) inherit the RLS policies of their respective civic_ tables. No additional RLS rules are required.*

#### Place lifecycle operations

Guarded Admin Place mutations use `pending / false`, `approved / true`, and
`hidden / false`. Approval is City Admin-only and requires an assigned city; CEO
may edit, hide, and restore but may not approve; PLATFORM_ADMIN may edit only;
EDITOR has no Place mutation authority. Restore returns `hidden / false` to
`pending / false`. Hide is accepted from `approved / true` and the legacy
`pending / true` state. Existing legacy rows are not normalized automatically.

These are operation-level invariants, not a claim that the database has a status
CHECK constraint. Authenticated direct DML remains revoked; all Place mutations
use `admin_mutate_civic_place(...)` and write their audit record in the same
transaction.

### 3.6 Table: civic_events

Represents historical or contemporary events.
column_name	data_type
id	uuid
city_id	uuid
name	text
event_type	text
description	text
start_date	date
end_date	date
severity	text
casualties	integer
economic_impact	numeric
created_at	timestamp with time zone
updated_at	timestamp with time zone
is_published	boolean
slug	text
tags	ARRAY
thumbnail_360_url	Text
ingestion_source	text
ingestion_metadata	jsonb
status	text
Ingestion columns (ingestion_source, ingestion_metadata, status) inherit the RLS policies of their respective civic_ tables. No additional RLS rules are required.*

### 3.7 Table: civic_places

Represents physical locations.
column_name	data_type
id	uuid
city_id	uuid
name	text
place_type	text
description	text
latitude	numeric
longitude	numeric
year_built	integer
year_demolished	integer
created_at	timestamp with time zone
updated_at	timestamp with time zone
is_published	boolean
neighborhood	text
slug	Text
ingestion_source	text
ingestion_metadata	jsonb
status	text
Ingestion columns (ingestion_source, ingestion_metadata, status) inherit the RLS policies of their respective civic_ tables. No additional RLS rules are required.*

### 3.8 Table: civic_moments

Represents narrative moments connecting events, places, entities, and eras.
column_name	data_type
id	uuid
title	text
city_id	uuid
created_at	timestamp with time zone
updated_at	timestamp with time zone
is_published	boolean
slug	text
moment_time	timestamp with time zone
thumbnail_360_url	text
inline_360_urls	ARRAY
body	Text
ingestion_source	text
ingestion_metadata	jsonb
status	text
Ingestion columns (ingestion_source, ingestion_metadata, status) inherit the RLS policies of their respective civic_ tables. No additional RLS rules are required.*

### 3.9 Table: civic_stories

create table public.civic_stories (
  id uuid not null default gen_random_uuid (),
  title text not null,
  body text null,
  summary text null,
  author_name text null,
  published_at timestamp with time zone null,
  city_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  slug text null,
  category text null,
  city text null,
  year integer null,
  tags text[] null,
  image_description text null,
  related_place_ids uuid[] null,
  related_entity_ids uuid[] null,
  related_moment_ids uuid[] null,
  date_range text null,
  neighborhood text null,
  cross_city_links text[] null,
  entities uuid[] null,
  is_published boolean null default false,
  is_frozen boolean null default false,
  contributor_id uuid null,
  review_status text null,
  review_notes text null,
  editor_id uuid null,
  reviewed_at timestamp with time zone null,
  revision_requested boolean null,
  revision_notes text null,
  revision_submitted_at timestamp with time zone null,
  flag_reason text null,
  hero_360_url text null,
  thumbnail_360_url text null,
  neighborhood_360_url text null,
  inline_360_urls text[] null,
  sponsor_360_url text null,
  sponsor_flat_url text null,
  sponsor_name text null,
  sponsor_link text null,
  sponsor_alt_text text null,
  hero_image_url text null,
  related_event_ids uuid[] null,
  updated_by uuid null,
  safety_hold boolean not null default false,
  safety_hold_notes text null,
  constraint stories_pkey primary key (id),
  constraint stories_primary_city_id_fkey foreign KEY (city_id) references cities (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists civic_stories_safety_hold_idx on public.civic_stories using btree (city_id, safety_hold) TABLESPACE pg_default;

create trigger set_updated_at_stories BEFORE
update on civic_stories for EACH row
execute FUNCTION set_updated_at ();

create trigger trg_search_index_story
after INSERT
or
update on civic_stories for EACH row
execute FUNCTION search_index_story_trigger ();

RLS Notes for civic_stories
• City Admins may UPDATE safety_hold and safety_hold_notes for their city.
• CEO may UPDATE safety_hold and safety_hold_notes for any city.
• Editors may NOT modify safety_hold or safety_hold_notes.
• Visibility fields (is_hidden, is_frozen, is_published) and safety fields (safety_hold, safety_hold_notes) are administrative controls and may be modified by CEO actions. CEO administrative actions never modify editorial fields (review_status, published_at, published_by).


### 3.10 Table: civic_neighborhoods

column_name	data_type
id	uuid
city_id	uuid
name	text
slug	text
description	text
created_at	timestamp with time zone
updated_at	timestamp with time zone
is_published	Boolean
ingestion_source	text
ingestion_metadata	jsonb
status	text
Ingestion columns (ingestion_source, ingestion_metadata, status) inherit the RLS policies of their respective civic_ tables. No additional RLS rules are required.*

### 3.11 Table: civic_artifacts

column_name	data_type
id	uuid
city_id	uuid
title	text
artifact_type	text
description	text
media_url	text
year	integer
created_at	timestamp with time zone
updated_at	timestamp with time zone
is_published	boolean
slug	text
city_slug	text
hero_image_url	text
hero_360_url	text
media_urls	ARRAY
tags	ARRAY
related_event_ids	ARRAY
ingestion_source	text
ingestion_metadata	jsonb
status	text
Ingestion columns (ingestion_source, ingestion_metadata, status) inherit the RLS policies of their respective civic_ tables. No additional RLS rules are required.*

### 3.12 Table: panoramas

A 360° media asset bound to a civic object. Contains the equirectangular image URL, display metadata, and lifecycle status. The primary rendering surface for the Electrum immersive viewer. A civic object may have multiple panoramas, ordered by display_order. Hotspots are placed inside panoramas.

column_name	data_type
id	uuid
city_id	uuid
civic_object_id	uuid
civic_object_type	text
equirectangular_url	text
thumbnail_url	text
label	text
description	text
display_order	integer
is_published	boolean
status	text
created_by	uuid
updated_by	uuid
created_at	timestamp with time zone
updated_at	timestamp with time zone


Column notes

civic_object_type — discriminator for the polymorphic FK to a civic table. Allowed values: civic_entity, civic_event, civic_place, civic_moment, civic_artifact, civic_neighborhood.

equirectangular_url — CDN URL in universal-media. Must be a 2:1 aspect-ratio equirectangular image or video.

status — 'draft' | 'published' | 'archived'. Mirrors the civic content lifecycle. Only published panoramas are visible to anon.

is_published — true when status = 'published'. Redundant boolean kept for query parity with civic content tables and canonical loader compatibility.

created_by / updated_by — FK → admin_users.id.

Relationships

city_id → cities.id

civic_object_id → the appropriate civic_* table, resolved by civic_object_type (polymorphic; no DB-level FK — enforced by trigger)

panoramas.id → hotspots.panorama_id (1 → many)

RLS

anon may SELECT where status = 'published'.

City Admins may SELECT / INSERT / UPDATE / DELETE for their cities.

Archiving a panorama cascades is_active = false on all child hotspots (trigger).

### 3.13 Table: hotspots

A spatial marker placed inside a panorama. Defines the position within the 360° image, the link target, the label, and the icon. When a user clicks, taps, or (in VR) gazes at a hotspot, it triggers navigation or displays information about the linked object or story.

Hotspots are relationships: they sit between a panorama (the image) and a civic object, story, another panorama, or an external URL.

column_name	data_type
id	uuid
panorama_id	uuid
city_id	uuid
pan_x	numeric
pan_y	numeric
target_type	text
target_id	uuid
target_url	text
label	text
icon	text
is_active	boolean
display_order	integer
metadata	jsonb
behavior	jsonb
created_by	uuid
updated_by	uuid
created_at	timestamp with time zone
updated_at	timestamp with time zone


Column notes

pan_x — Normalized horizontal position within the equirectangular image. Range: 0.0 (left edge) to 1.0 (right edge). Not a real-world longitude.

pan_y — Normalized vertical position within the equirectangular image. Range: 0.0 (top) to 1.0 (bottom). Not a real-world latitude.

target_type — Discriminator for the link target. Allowed values: civic_entity, civic_event, civic_place, civic_moment, civic_artifact, civic_neighborhood, civic_story, panorama, external_url.

target_id — UUID of the linked record in the table corresponding to target_type. NULL when target_type = 'external_url'.

target_url — Absolute URL. Only populated when target_type = 'external_url'. NULL otherwise.

label — Short display text shown on the hotspot callout card.

icon — Icon identifier from the design system icon set.

is_active — false hides the hotspot from the public viewer without deleting it.

metadata — Optional structured metadata (e.g., caption, attribution). Open-ended JSONB.

behavior — Optional viewer behavior configuration (e.g., auto-open on load, VR gaze dwell duration). Open-ended JSONB.

city_id — Denormalised from parent panorama for RLS performance.

created_by / updated_by — FK → admin_users.id.

Constraint: exactly one target per hotspot
Enforced by CHECK constraint: when target_type is a civic or story type, target_id IS NOT NULL and target_url IS NULL; when target_type = 'panorama', target_id IS NOT NULL and target_url IS NULL; when target_type = 'external_url', target_url IS NOT NULL and target_id IS NULL.

Relationships

panorama_id → panoramas.id (CASCADE DELETE)

city_id → cities.id

target_id → the appropriate civic_*, civic_stories, or panoramas table, resolved by target_type (polymorphic; enforced by application layer + RPC validation)

created_by / updated_by → admin_users.id

RLS

anon may SELECT where is_active = true AND the parent panoramas.status = 'published'.

City Admins may SELECT / INSERT / UPDATE / DELETE for their cities (scoped by city_id).

Linked target_id objects must be published before the hotspot is activated (enforced by rpc_validate_hotspot_target).


### 3.14 Table: games

Defines games for the public interface.

column_name	data_type
id	uuid
city_id	uuid NULL REFERENCES cities(id)
slug	text
title	text
description	text
game_type	text
game_data	jsonb
difficulty	text
is_active	boolean
max_score	integer
created_at	timestamp with time zone
updated_at	timestamp with time zone
published_at	timestamp with time zone

The canonical public contract is defined by GAMES_MODEL.md. City games are selected
by city_id and is_active = true. Global games may use a NULL city_id and are not
included in a hostname-resolved city's game list. game_data remains the structured
game configuration payload. Its public question format is either `questions` with
`prompt`, `options`, `answer`, and optional `explanation`, or the existing `words`
format with `clue`, `scrambled`, and `answer`. The public game UI reads this JSON
through the published game row; it does not read attempts or scores.

Legacy compatibility columns city_name, published, visibility, and owner_id are
retained during data migration only. Public loaders must not use them. is_active is
the canonical publication gate.

### 3.15 Table: ad_slots DEPRECATED

DEPRECATED — superseded by sponsorship_placements. Do not use in new code. Existing rows are preserved for historical reference. Workspace must not query ad_slots in any new loader, API route, or admin module.
column_name	data_type
id	uuid
name	text
position	text
width	integer
height	integer
description	text
created_at	timestamp with time zone

### 3.16 Table: sponsors

Defines sponsor organizations.
column_name	data_type
id	uuid
name	text
slug	text
logo_url	text
contact_email	text
created_at	timestamp with time zone
updated_at	timestamp with time zone
deleted_at	timestamp with time zone

### 3.17 Table: sponsor_allocations

Individual sponsor contributions applied against a city_budget period. Tracks how much Sponsor capital is allocated to each city. City budgets are derived from these allocations.
Column	Type	Constraints	Notes
id	uuid	PRIMARY KEY
DEFAULT gen_random_uuid()	
city_budget_id	uuid	NOT NULL
FK → city_budget(id)
ON DELETE RESTRICT	Parent budget period.
city_id	uuid	NOT NULL
FK → cities(id)	Denormalized for RLS efficiency.
sponsor_name	text	NOT NULL	Display name of the sponsoring entity.
sponsor_ref	text	NULLABLE	External CRM or contract reference ID.
amount_cents	bigint	NOT NULL
CHECK (> 0)	Contribution amount in USD cents.
notes	text	NULLABLE	Free-form notes; use for soft-cancel context until v5 adds a status column.
created_by	uuid	NOT NULL
FK → admin_users(id)	
created_at	timestamptz	NOT NULL
DEFAULT now()	
updated_at	timestamptz	NOT NULL
DEFAULT now()	
Relationships
•	sponsor_id → sponsors.id
•	city_id → cities.id
RPC Recommendation Updating sponsor allocations should call recalculate_city_budget.
RLS Notes
•	City Admins may SELECT allocations for their cities.
•	CEO may INSERT/UPDATE/DELETE.

### 3.18 Table: production_units

A discrete content or program unit that city admins create for writers/editors to write about. Organizational container linking financial planning to editorial output. Represents every paid deliverable in Electrum’s production pipeline. A production unit is created when a Contributor or City Admin submits a story, photo, caption, or other civic object for editorial review.
Column	Type	Constraints	Notes
id	uuid	PRIMARY KEY
DEFAULT gen_random_uuid()	
city_id	uuid	NOT NULL
FK → cities(id)
ON DELETE RESTRICT	RLS scoping key.
city_budget_id	uuid	NULLABLE
FK → city_budget(id)	Production unit may or may not be budget-tied.
created_by	uuid	NOT NULL
FK → admin_users(id)	The city_admin who created this unit.
title	text	NOT NULL	
description	text	NULLABLE	
gross_cost			
net_city_cost			
sponsor_credit			
target_payout_cents	bigint	NULLABLE	Intended payout per approved story in this unit (USD cents).
contributor_payout			
editor_payout			
status	text	NOT NULL
DEFAULT 'open'	One of 'open' | 'in_progress' | 'complete' | 'cancelled'.
due_date	date	NULLABLE	Target completion date.
created_at	timestamptz	NOT NULL
DEFAULT now()	
updated_at	timestamptz	NOT NULL
DEFAULT now()	
settled_at			
unit_type
•	story
•	story_revision
•	photo
•	caption
•	city_update
content_tier text NOT NULL -- Allowed: 'standard' | 'feature' | 'investigation'
status
•	open
•	submitted
•	editor_approved
•	city_published
•	rejected
•	unpublishable
Relationships & RLS
One city_admin creates many production_units. One production_unit may have many civic_stories (via civic_stories.production_unit_id). One production_unit optionally belongs to one city_budget. RLS: city_admin can INSERT/UPDATE/SELECT for their city. Editors can SELECT 'open' production_units for their city only — no INSERT or UPDATE.
•	contributor_id → admin_users.id
•	editor_id → admin_users.id
•	city_id → cities.id
•	story_id → civic_stories.id
•	city_budget_id → city_budget.id
• 	City Admins may INSERT production_units only via RPC during publication (Option A).
• 	City Admins may UPDATE production_units.status → 'city_published'.
• 	City Admins may NOT UPDATE cost fields (gross_cost, contributor_payout, editor_payout, net_city_cost, sponsor_credit) after creation.
•	Contributors may SELECT their own units.
•	Editors may SELECT units they reviewed.
•	City Admins may SELECT units for their cities.
•	Only City Admins may transition units to city_published.
•	CEO may update all fields.

### 3.19 Table: payout_batches

A grouped set of payout items submitted for payment processing in one operation. Tied to a city_budget period. Batches are manually created by City Admin. 
Column	Type	Constraints	Notes
id	uuid	PRIMARY KEY
DEFAULT gen_random_uuid()	
city_id	uuid	NOT NULL
FK → cities(id)
ON DELETE RESTRICT	RLS scoping key.
city_budget_id	uuid	NOT NULL
FK → city_budget(id)
ON DELETE RESTRICT	Budget period this batch draws against.
batch_ref	text	UNIQUE
NULLABLE	External payment processor reference ID.
total_amount_cents	bigint	NOT NULL
DEFAULT 0
CHECK (>= 0)	Sum of payout_batch_items; maintained by trigger or RPC.
status	text	NOT NULL
DEFAULT 'pending'	One of 'pending' | 'submitted' | 'processing' | 'paid' | 'failed' | 'cancelled'.
submitted_at	timestamptz	NULLABLE	Set when batch is submitted to payment processor.
paid_at	timestamptz	NULLABLE	Set when all items reach 'paid'.
created_by	uuid	NOT NULL
FK → admin_users(id)	
created_at	timestamptz	NOT NULL
DEFAULT now()	
updated_at	timestamptz	NOT NULL
DEFAULT now()	

 Status Transition Rules
A payout_batch may only be created against a city_budget with status = 'active' (enforce via RPC). city_admin can INSERT (status='pending') and SELECT for their city. Only CEO can transition status to 'paid' or 'failed'. Status transitions must be enforced via RPC, not direct UPDATE.

### 3.20 Table: city_budget
Annual or period budget envelope allocated to a city. Parent record for all financial operations within a city-period.
Column	Type	Constraints	Notes
id	uuid	PRIMARY KEY
DEFAULT gen_random_uuid()	
city_id	uuid	NOT NULL
FK → cities(id)
ON DELETE RESTRICT	RLS scoping key.
fiscal_year	integer	NOT NULL	e.g., 2026.
period_label	text	NULLABLE	Free-form label, e.g., 'Q3 2026'.
total_budget_cents	bigint	NOT NULL
CHECK (> 0)	Total allocated budget in USD cents.
allocated_cents	bigint	NOT NULL
DEFAULT 0
CHECK (>= 0)	Sum of sponsor_allocations; updated by trigger or RPC.
spent_amount_cents	bigint
	NOT NULL DEFAULT 0 CHECK (spent_amount_cents >= 0),
	
remaining_cents	bigint GENERATED ALWAYS AS (total_budget_cents - allocated_cents) STORED	COMPUTED	Derived column; do not write directly.
status	text	NOT NULL
DEFAULT 'active'	One of 'draft' | 'active' | 'closed'.
created_by	uuid	NOT NULL
FK → admin_users(id)	
created_at	timestamptz	NOT NULL
DEFAULT now()	
updated_at	timestamptz	NOT NULL
DEFAULT now()	
			

Relationships
•	city_id → cities.id
RPC Recommendation 
recalculate_city_budget(city_id) recomputes allocated/spent/remaining.
RLS Notes
•	City Admins may SELECT their city’s budget.
•	CEO may UPDATE all fields.

### 3.21 Table: payout_batch_items
Individual line items within a payout batch. Each item represents one payable event — typically tied to a published civic_story or production_unit deliverable.

Column	Type	Constraints	Notes
id	uuid	PRIMARY KEY
DEFAULT gen_random_uuid()	
payout_batch_id	uuid	NOT NULL
FK → payout_batches(id)
ON DELETE CASCADE	Parent batch. Cascade delete removes items if batch is deleted.
city_id	uuid	NOT NULL
FK → cities(id)	Denormalized for RLS efficiency.
civic_story_id	uuid	NULLABLE
FK → civic_stories(id)	The story being compensated, if applicable.
production_unit_id	uuid	NULLABLE
FK → production_units(id)	The production unit associated with this payout.
payee_id	uuid	NOT NULL
FK → admin_users(id)	The editor or contributor being paid.
description	text	NULLABLE	Human-readable description of what is being paid.
amount_cents	bigint	NOT NULL
CHECK (> 0)	Payout amount in USD cents.
status	text	NOT NULL
DEFAULT 'pending'	One of 'pending' | 'approved' | 'paid' | 'rejected'. Mirrors parent batch status.
created_at	timestamptz	NOT NULL
DEFAULT now()	
updated_at	timestamptz	NOT NULL
DEFAULT now()	

Relationships
•	payout_batch_id → payout_batches.id
•	production_unit_id → production_units.id
Trigger Recommendation 
A BEFORE INSERT/UPDATE/DELETE trigger recalculates payout_batches.total_amount_cents.
Constraints & Triggers
A payout_batch_item cannot be added to a batch with status != 'pending' (enforce via trigger or RPC check_batch_open). When all items in a payout_batch reach status = 'paid', a trigger or RPC should set payout_batches.status = 'paid' and record paid_at. No DELETE — use status = 'rejected'.
RLS Note
city_admin can INSERT items into batches they own. The payee (editor) can SELECT their own rows via payee_id = auth.uid().

### 3.22 Table: raw_ingestion
id	uuid
source_name	text
source_object_id	text
payload	jsonb
ingested_at	timestampz
processed	Bool
rpc_ingest_raw: Used by ingestion jobs to insert raw payloads.

CREATE OR REPLACE FUNCTION rpc_ingest_raw(
  source_name text,
  source_object_id text,
  payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO raw_ingestion (source_name, source_object_id, payload)
  VALUES (source_name, source_object_id, payload)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

rpc_normalize_object: Used by normalization workers to convert raw_ingestion → civic_* tables.

CREATE OR REPLACE FUNCTION rpc_normalize_object(
  raw_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalization logic implemented in worker code.
  -- This RPC marks the raw_ingestion row as processed.
  UPDATE raw_ingestion
  SET processed = true
  WHERE id = raw_id;
END;
$$;
rpc_apply_suggestion
Used by City Admins to accept AI suggestions.
CREATE OR REPLACE FUNCTION rpc_apply_suggestion(
  suggestion_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  s civic_object_suggestions;
BEGIN
  SELECT * INTO s FROM civic_object_suggestions WHERE id = suggestion_id;

  -- Application logic handled in worker code (slug, summary, tags, etc.)

  DELETE FROM civic_object_suggestions WHERE id = suggestion_id;
END;
$$;

rpc_mark_ingestion_processed
Used by ingestion workers to mark raw_ingestion rows as processed.

CREATE OR REPLACE FUNCTION rpc_mark_ingestion_processed(
  raw_id uuid
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE raw_ingestion
  SET processed = true
  WHERE id = raw_id;
$$;

### 3.23 Table: civic_object_suggestions
id	uuid
object_type	text
object_id	uuid
suggestion_type	text
payload	jsonb
created_at	timestampz

### 3.24 Table: admin_users
Defines authenticated admin users.
column_name	data_type
id	uuid
user_id	uuid
email	text
role	text
city_ids	ARRAY
created_at	timestamp with time zone
updated_at	timestamp with time zone
primary_city_slug	text
status	text
password_hash	text
auth_uid	text

Identity mapping:
• `id` is the primary key of the `admin_users` row and is distinct from the Auth user ID.
• `user_id` references the corresponding `auth.users.id` and must equal it.
• `auth_uid` is a legacy duplicate of the Auth user ID; keep it equal to `user_id` while existing policies and application code still use it.

### 3.25 Table: roles
Defines platform level permission roles for authenticated users.
column_name	data_type
id	uuid
name	text
description	text
created_at	timestamp with time zone
-- Publish permission has been revoked on civic_stories
-- Create, read, and update has been granted on civic_stories drafts
-- Publish 

### 3.26 Table: user_roles
Join table linking authenticated users to roles.
column_name	data_type
id	uuid
user_id	uuid
created_at	timestamp with time zone
role_id	Uuid

### 3.27 Table: admin_action_logs
column_name	data_type
id	uuid
actor_user_id	uuid
actor_admin_id	uuid
actor_role	text
action	text
domain	text
entity_type	text
entity_id	uuid
target_user_id	uuid
metadata	jsonb
ip_address	inet
user_agent	text
created_at	timestamp with time zone
log_admin_action() for ingestion events:

Events include:
•	ingestion_started
•	ingestion_normalized
•	ingestion_enriched
•	ingestion_suggestion_created
•	ingestion_media_bound
•	ingestion_approved
•	ingestion_hidden
-- Extend existing log_admin_action() to include ingestion events.
-- No structural changes required; only new action strings.

### 3.28 Table: sponsor_profiles
Extended sponsor profile; 1:1 with sponsors. Auto-created by trigger on sponsors INSERT.
brand_safety_status and good_standing_status gate campaign activation.

| column_name          | data_type | constraints                                         | notes                                   |
|----------------------|-----------|-----------------------------------------------------|-----------------------------------------|
| id                   | uuid      | PRIMARY KEY DEFAULT gen_random_uuid()               |                                         |
| sponsor_id           | uuid      | NOT NULL UNIQUE FK → sponsors(id) ON DELETE CASCADE | 1:1 with sponsors                       |
| organization_name    | text      | NOT NULL                                            | Legal organization name                 |
| contact_email        | text      | NOT NULL                                            | Primary billing/contact email           |
| brand_safety_status  | text      | NOT NULL DEFAULT 'pending'                          | 'pending' \| 'approved' \| 'rejected' \| 'suspended' |
| good_standing_status | boolean   | NOT NULL DEFAULT true                               | false blocks campaign activation        |
| metadata             | jsonb     | NOT NULL DEFAULT '{}'                               | contract_ref, account_manager, notes    |
| created_at           | timestamptz | NOT NULL DEFAULT now()                            |                                         |
| updated_at           | timestamptz | NOT NULL DEFAULT now()                            |                                         |

Relationships
•  sponsor_id → sponsors.id (CASCADE DELETE)
•  sponsor_profiles.id ← sponsorship_campaigns (via sponsor_id → sponsors.id)

RLS
•  City Admins: SELECT for sponsors linked to their city's campaigns.
•  CEO: full CRUD.
•  Sponsor (authenticated): SELECT own row via sponsor_id match.
•  anon: no access.

---

### 3.29 Table: sponsorship_campaigns
Campaign lifecycle record. Status gates placement activation. Activation is via RPC only;
direct status UPDATE is blocked by trigger validation.

| column_name    | data_type   | constraints                                                                          | notes                                             |
|----------------|-------------|--------------------------------------------------------------------------------------|---------------------------------------------------|
| id             | uuid        | PRIMARY KEY DEFAULT gen_random_uuid()                                                | referred to as campaign_id in application code    |
| sponsor_id     | uuid        | NOT NULL FK → sponsors(id)                                                           |                                                   |
| city_id        | uuid        | NOT NULL FK → cities(id)                                                             | RLS scoping key                                   |
| placement_type | text        | NOT NULL CHECK IN ('targeted','citywide','run_of_site')                              |                                                   |
| start_date     | date        | NOT NULL                                                                             | Inclusive                                         |
| end_date       | date        | NOT NULL CHECK (end_date >= start_date)                                              | Inclusive                                         |
| status         | text        | NOT NULL DEFAULT 'draft' CHECK IN ('draft','active','expired','terminated')          | See lifecycle below                               |
| pricing_tier   | text        | NOT NULL CHECK IN ('standard','featured','premier')                                  | Determines cost and slot priority                 |
| metadata       | jsonb       | NOT NULL DEFAULT '{}'                                                                | contract_ref, notes, billing_cycle                |
| created_by     | uuid        | FK → admin_users(id)                                                                 |                                                   |
| created_at     | timestamptz | NOT NULL DEFAULT now()                                                               |                                                   |
| updated_at     | timestamptz | NOT NULL DEFAULT now()                                                               |                                                   |

Lifecycle
•  draft → active   via rpc_activate_campaign (requires brand_safety_status = 'approved' AND good_standing_status = true)
•  active → expired  auto via trg_expire_placements when end_date < CURRENT_DATE, or via rpc_expire_campaign
•  active → terminated  CEO only; terminal state
•  expired and terminated are terminal states; no further transitions allowed

Relationships
•  sponsor_id → sponsors.id
•  city_id → cities.id
•  id → sponsorship_placements.campaign_id (1 → many; CASCADE DELETE)
•  id → creative_assets.campaign_id (1 → many; CASCADE DELETE)

RLS
•  City Admins: full CRUD for their city_id. Cannot activate directly (activation via RPC only).
•  CEO: full CRUD across all cities.
•  Sponsor (authenticated): SELECT own campaigns (WHERE sponsor_id matches).
•  anon: no direct access. Active placements are surfaced via rpc_get_active_sponsorships.

---

### 3.30 Table: sponsorship_placements
City/page-level placement slot binding a campaign to a specific surface. is_active is
trigger-managed — never set directly. Supersedes ad_slots.

| column_name  | data_type   | constraints                                                                            | notes                                                                    |
|--------------|-------------|----------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| id           | uuid        | PRIMARY KEY DEFAULT gen_random_uuid()                                                  | referred to as placement_id in application code                          |
| campaign_id  | uuid        | NOT NULL FK → sponsorship_campaigns(id) ON DELETE CASCADE                              |                                                                          |
| city_id      | uuid        | NOT NULL FK → cities(id)                                                               | Denormalised for RLS; enforced to match campaign city_id by trigger      |
| page_type    | text        | NOT NULL CHECK IN ('story','object','timeline','games','homepage')                      |                                                                          |
| page_id      | uuid        | NULL                                                                                   | Specific page/object UUID; NULL = citywide on this page_type             |
| slot_name    | text        | NOT NULL                                                                               | UI slot identifier e.g. 'hero_banner', 'sidebar_top', 'inline_mid'      |
| is_active    | boolean     | NOT NULL DEFAULT false                                                                  | Controlled by campaign status triggers; do not write directly            |
| created_at   | timestamptz | NOT NULL DEFAULT now()                                                                 |                                                                          |
| updated_at   | timestamptz | NOT NULL DEFAULT now()                                                                 |                                                                          |

Activation rules
•  is_active = true when parent sponsorship_campaigns.status transitions to 'active'
•  is_active = false when parent status transitions to 'expired' or 'terminated'
•  Both transitions managed by triggers (§15); direct UPDATE of is_active is not permitted in application code

Relationships
•  campaign_id → sponsorship_campaigns(id) (CASCADE DELETE)
•  city_id → cities.id

RLS
•  anon: SELECT WHERE is_active = true (active placements only).
•  City Admins: full CRUD for their city_id.
•  CEO: full CRUD.
•  Sponsor (authenticated): SELECT own placements (via campaign → sponsor linkage).

---

### 3.31 Table: creative_assets
Typed creative assets attached to a sponsorship campaign. Served to public consumers via
rpc_get_active_sponsorships — never queried directly by public loaders. Supersedes ad_creatives.

| column_name  | data_type   | constraints                                                                         | notes                                                     |
|--------------|-------------|-------------------------------------------------------------------------------------|-----------------------------------------------------------|
| id           | uuid        | PRIMARY KEY DEFAULT gen_random_uuid()                                               | referred to as asset_id in application code               |
| sponsor_id   | uuid        | NOT NULL FK → sponsors(id)                                                          | Denormalised for fast sponsor-scoped queries              |
| campaign_id  | uuid        | NOT NULL FK → sponsorship_campaigns(id) ON DELETE CASCADE                           |                                                           |
| asset_type   | text        | NOT NULL CHECK IN ('image','text','logo','alt_text','caption','story_promo','object_promo','timeline_promo','homepage_promo','banner','square','wide','360_promo') |                                                           |
| asset_url    | text        | NULL                                                                                | Required for image, logo, and placement-specific creatives |
| content      | text        | NULL                                                                                | Required when asset_type IN ('text','alt_text','caption') |
| metadata     | jsonb       | NOT NULL DEFAULT '{}'                                                               | width, height, mime_type, alt_text for placement creatives |
| created_at   | timestamptz | NOT NULL DEFAULT now()                                                              |                                                           |
| updated_at   | timestamptz | NOT NULL DEFAULT now()                                                              |                                                           |

CHECK constraint
CHECK (
  (asset_type IN (
    'image','logo','story_promo','object_promo','timeline_promo','homepage_promo',
    'banner','square','wide','360_promo'
  ) AND asset_url IS NOT NULL) OR
  (asset_type IN ('text','alt_text','caption') AND content IS NOT NULL)
)

CHECK (
  asset_type NOT IN ('story_promo','object_promo','timeline_promo','homepage_promo')
  OR (
    jsonb_typeof(metadata -> 'alt_text') = 'string'
    AND length(trim(metadata ->> 'alt_text')) > 0
  )
)

Relationships
•  sponsor_id → sponsors.id
•  campaign_id → sponsorship_campaigns(id) (CASCADE DELETE)

RLS
•  anon: no direct access. Assets served via rpc_get_active_sponsorships.
•  City Admins: SELECT for campaigns in their city.
•  CEO: full CRUD.
•  Sponsor (authenticated): SELECT own assets (WHERE sponsor_id matches).

Storage
•  creative image/logo assets → universal-media/sponsorships/<sponsorId>/campaigns/<campaignId>/

### 3.32 Table: game_users
Player identity record. Supports authenticated users (user_id set) and anonymous guest
sessions (user_id = NULL, session_token set). Exactly one identity signal per row is
enforced by CHECK constraint. total_score and games_played are trigger-managed counters —
do not write them directly.

| column_name   | data_type   | constraints                                                                            | notes                                                          |
|---------------|-------------|----------------------------------------------------------------------------------------|----------------------------------------------------------------|
| id            | uuid        | PRIMARY KEY DEFAULT gen_random_uuid()                                                  |                                                                |
| user_id       | uuid        | NULL FK → auth.users(id) ON DELETE SET NULL                                            | NULL for anonymous/guest players                               |
| session_token | text        | NULL                                                                                   | Client-generated session ID for anonymous players              |
| display_name  | text        | NULL                                                                                   | Optional player name (max 50 chars)                            |
| city_id       | uuid        | NULL FK → cities(id)                                                                   | Optional; used for city-scoped leaderboards                    |
| total_score   | integer     | NOT NULL DEFAULT 0 CHECK (total_score >= 0)                                            | Maintained by trg_game_users_score_counter; do not write       |
| games_played  | integer     | NOT NULL DEFAULT 0 CHECK (games_played >= 0)                                           | Maintained by trg_game_users_attempt_counter; do not write     |
| created_at    | timestamptz | NOT NULL DEFAULT now()                                                                 |                                                                |
| updated_at    | timestamptz | NOT NULL DEFAULT now()                                                                 |                                                                |

CHECK constraint
CHECK (
  (user_id IS NOT NULL AND session_token IS NULL) OR
  (user_id IS NULL AND session_token IS NOT NULL)
)
-- Exactly one identity signal per row.

Relationships
•  user_id → auth.users(id) (SET NULL on delete; row preserved for score history)
•  city_id → cities.id
•  id → game_attempts.game_user_id (1 → many)
•  id → game_scores.game_user_id (1 → many)

RLS
•  anon: INSERT own row (guest session, session_token IS NOT NULL); SELECT own row via session_token match.
•  authenticated: INSERT / SELECT / UPDATE own row (WHERE user_id = auth.uid()).
•  City Admins: SELECT game_users for their city_id.
•  CEO: full SELECT.
•  No role may DELETE game_users (use user_id = NULL soft-disassociation on auth user deletion).

Notes
•  Leaderboard queries: SELECT * FROM game_users WHERE city_id = :city_id ORDER BY total_score DESC.
•  total_score and games_played are maintained by triggers defined in §15.

### **3.32 Table: `search_index`**  
 *Canonical Search Index Specification (Frontend + Backend)*

The `search_index` table stores all indexable civic content for Electrum’s search subsystem.  
Each row represents one searchable facet of one entity.  
All fields are populated by `rpc_reindex_entity` and governed by strict RLS.

---

 **Table Definition**

```sql
create table public.search_index (
  id uuid not null default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  city_id uuid not null,
  title text not null,
  subtitle text null,
  summary text null,
  keywords text[] not null default '{}'::text[],
  thumbnail_url text null,
  route text not null,
  search_vector tsvector not null,
  entity_weight numeric(3,2) not null default 1.0,
  is_published boolean not null default false,
  facet text not null default 'primary',
  source_updated_at timestamptz not null,
  indexed_at timestamptz not null default now(),
  constraint search_index_pkey primary key (id),
  constraint search_index_city_id_fkey foreign key (city_id) references cities(id),
  constraint search_index_entity_type_check check (
    entity_type = any (array[
      'story','object','timeline','codex','game','city','contributor'
    ])
  )
);
```

---

 **Field Population Rules**

 **id**
- Generated automatically via `gen_random_uuid()`.
- Never supplied by clients.

 **entity_type**
- One of the allowed civic types.
- Populated by `rpc_reindex_entity` based on the source table.

 **entity_id**
- FK to the source record.
- Populated by triggers on INSERT/UPDATE/DELETE of source tables.

 **city_id**
- FK → `cities.id`.
- Populated by the source record’s `city_id`.
- Used for RLS scoping and city‑specific search.

 **title**
- Required.
- Derived from the source record’s canonical title field.
- Must be human‑readable and ADA‑safe.

 **subtitle**
- Optional.
- Derived from source metadata (e.g., category, date, type).
- Used as secondary display text.

 **summary**
- Optional.
- Truncated body text (≤ 280 chars).
- Used for preview text in search result cards.

 **keywords**
- Array of tags, categories, era names, entity types.
- Used for ranking and fuzzy matching.
- Must never contain sponsor or campaign identifiers.

 **thumbnail_url**
- Optional.
- URL to a small preview image.
- Must be ADA‑safe (alt text generated in frontend).

 **route**
- Required.
- **Absolute pathname beginning with `/`**.
- **Never includes a citySlug prefix.**
- Constructed by `rpc_reindex_entity` using the routing rules in SEARCH_ROUTING_GUIDE.
- Examples:
  - `/stories/the-last-mural`
  - `/events/port-chicago-disaster`
  - `/timeline`
  - `/codex/reconstruction`

 **search_vector**
- Required.
- Precomputed `tsvector` over:
  - title  
  - summary  
  - keywords  
- Indexed via GIN for fast full‑text search.

 **entity_weight**
- Default `1.0`.
- Used for ranking (stories > objects > codex > timeline, etc.).
- Controlled by SEARCH_MODEL ranking rules.

 **is_published**
- Required.
- `true` only when the source record is published.
- Unpublished rows are excluded from anon queries via RLS.

 **facet**
- Default `'primary'`.
- Reserved for multi‑facet indexing (e.g., codex facet for eras).
- Ensures uniqueness of `(entity_type, entity_id, facet)`.

 **source_updated_at**
- Timestamp of the source record’s last update.
- Used for recency ranking.

 **indexed_at**
- Timestamp of last index write.
- Used for debugging and admin logs.

---

 **Indexing Rules**

 **GIN full‑text index**
```sql
idx_search_index_vector on search_vector
```
- Supports fast full‑text search.

 **Trigram index on title**
```sql
idx_search_index_title_trgm on title gin_trgm_ops
```
- Supports autocomplete and fuzzy matching.

 **City‑scoped queries**
```sql
idx_search_index_city_id on city_id
```
- All search is city‑scoped in v1.

 **Unique entity facet index**
```sql
idx_search_index_entity on (entity_type, entity_id, facet)
```
- Ensures one row per facet per entity.

 **Published gate**
```sql
idx_search_index_published where is_published = true
```
- Used for anon read path.

 **Recency ranking**
```sql
idx_search_index_recency where is_published = true
```
- Supports “recently updated” ranking.

---

 **RLS Notes**

 **Anon role**
- Can **SELECT** only rows where `is_published = true`.
- Cannot see unpublished or draft content.
- Cannot see sponsorship content (search is sponsorship‑independent).

 **Service role**
- Full access for indexing, admin UI, and RPCs.

 **Policies**
- Must use:
  ```sql
  to anon using (true)
  ```
- No restrictive policies may override anon SELECT.

---

 **Trigger Notes**

 **Source table triggers**
Every source table (stories, objects, events, places, moments, artifacts, neighborhoods, eras, contributors, games) must:

- Call `rpc_reindex_entity` on:
  - INSERT  
  - UPDATE  
  - DELETE  

 **Slug changes**
- Trigger recomputes `route`.
- Old route is overwritten.
- Source table handles 301 redirects separately.

 **Deletes**
- Trigger sets `is_published = false`.
- Row excluded from anon queries.

---

**Summary**

The `search_index` table is the canonical search surface for Electrum.  
It stores normalized, ranked, ADA‑safe metadata for all civic content.  
Routes are domain‑based, never slug‑prefixed.  
Indexing is trigger‑driven, RLS‑safe, and sponsorship‑independent.

### 3.34 Table: civic_object_page_settings

Per-object public presentation settings. The public loader may SELECT only the
allowlisted presentation and SEO columns; updated_by and updated_at are never
returned to the public application.

| column_name | data_type |
|---|---|
| id | uuid primary key |
| city_id | uuid not null references cities(id) |
| civic_object_id | uuid not null |
| civic_object_type | text not null; civic_entity, civic_event, civic_place, civic_moment, civic_artifact, civic_neighborhood |
| show_nearby_map | boolean not null default true |
| show_related_stories | boolean not null default true |
| show_media_gallery | boolean not null default true |
| show_sponsor_bar | boolean not null default true |
| seo_title | text, max 70 characters |
| seo_description | text, max 160 characters |
| canonical_url | text |
| og_image_url | text |
| enable_vr_button | boolean not null default true |
| enable_ar_button | boolean not null default false |
| updated_by | uuid references admin_users(id) |
| updated_at | timestamptz not null default now() |

UNIQUE (civic_object_id, civic_object_type). civic_object_id is polymorphic and
therefore has no direct FK; civic_object_type is a singular discriminator, not the
plural source table name. civic_eras are not a supported settings type.

### 3.35 Table: story_page_settings

Per-story presentation settings. Public loaders may SELECT only the allowlisted
presentation and SEO columns; updated_by and updated_at are never returned publicly.

| column_name | data_type |
|---|---|
| id | uuid primary key |
| city_id | uuid not null references cities(id) |
| civic_story_id | uuid not null references civic_stories(id) on delete cascade |
| show_related_stories | boolean not null default true |
| show_sponsor_bar | boolean not null default true |
| show_production_attribution | boolean not null default false |
| enable_inline_360 | boolean not null default true |
| inline_360_captions | jsonb not null default '{}' |
| seo_title | text, max 70 characters |
| seo_description | text, max 160 characters |
| canonical_url | text |
| og_image_url | text |
| enable_vr_button | boolean not null default true |
| enable_ar_button | boolean not null default false |
| updated_by | uuid references admin_users(id) |
| updated_at | timestamptz not null default now() |

UNIQUE (civic_story_id).

---

## 4. Join Tables

Electrum uses a combination of generalized and specialized join tables to connect civic content across time, place, narrative, and identity. These tables do not represent standalone civic objects; instead, they define relationships between core tables.
Join tables fall into two categories:
•	Generalized relationship graph — flexible, multi type relationships
•	Specialized join tables — optimized for high frequency civic relationships
Generalized Relationship Graph

Table: civic_relationships
Unified relationship graph connecting all civic content.
column_name	data_type
id	uuid
from_type	text
from_id	uuid
to_type	text
to_id	uuid
created_at	timestamp with time zone

Purpose Allows arbitrary relationships between any civic objects (entity → place, event → story, moment → entity, etc.). Used for flexible graph queries, Atlas, and future AI generation.
Specialized Join Tables
These tables exist because certain civic relationships are extremely common and benefit from optimized queries, indexes, and predictable structure.
event_eras
Join table linking events ↔ eras.
column_name	data_type
id	uuid
event_id	uuid
era_id	uuid
created_at	timestamp with time zone

moment_eras
Join table linking moments ↔ eras.
column_name	data_type
id	uuid
moment_id	uuid
era_id	uuid

moment_entities
Join table linking moments ↔ entities.
column_name	data_type
id	uuid
moment_id	uuid
entity_id	uuid
role	text
created_at	timestamp with time zone
updated_at	timestamp with time zone

moment_places
Join table linking moments ↔ places.
column_name	data_type
id	uuid
moment_id	uuid
place_id	uuid

moment_stories
Join table linking moments ↔ stories. Optional / future use.
column_name	data_type
id	uuid
moment_id	uuid
story_id	uuid
created_at	timestamp with time zone
updated_at	timestamp with time zone

moment_neighborhoods
Join table linking moments ↔ neighborhoods. Optional / future use.
column_name	data_type
id	uuid
moment_id	uuid
neighborhood_id	uuid

## 5. Naming Conventions

Table Naming
Electrum table names follow a domain_prefix + object_name pattern.
City Domain
Tables begin with the city_ prefix.
•	city_brand_settings
•	city_design_system
•	city_feature_toggles
•	city_navigation
•	city_prompts

Civic Domain
Tables begin with the civic_ prefix.
•	civic_entities
•	civic_events
•	civic_places
•	civic_stories
•	civic_moments
•	civic_eras
•	civic_neighborhoods
•	civic_artifacts

Relationship Domain
Join tables use a source_target pattern.
•	event_eras
•	moment_entities
•	moment_places
•	moment_eras
•	moment_stories
•	moment_neighborhoods

Generalized relationships use:
•	civic_relationships

Sponsor Domain
Active sponsorship tables use the sponsorship_ prefix. Sponsor identity and profile tables
use the sponsor_ prefix. Creative assets use the creative_ prefix. Legacy ad_* tables are
deprecated and must not be used in new code.
Active tables:
•   sponsors                   — base identity (no prefix; predates convention)
•   sponsor_profiles           — sponsor_ prefix
•   sponsorship_campaigns      — sponsorship_ prefix
•   sponsorship_placements     — sponsorship_ prefix
•   creative_assets            — creative_ prefix
Deprecated (do not use in new code):
•   ad_slots                   — superseded by sponsorship_placements
•   ad_creatives               — superseded by creative_assets
•   ad_impressions             — not required for launch; future reporting
•   ad_clicks                  — not required for launch; future reporting

Search Domain
Tables in the search subsystem use the `search_` prefix.
Electrum v1 contains exactly one search table:
•   search_index        — canonical search surface (full‑text index)
No other tables may use the `search_` prefix. All search metadata, ranking, routing, and indexing logic is stored exclusively in search_index.
Future expansion (autocomplete, federated search, multi‑city search) must continue to use the `search_` prefix and follow this domain rule

Gaming Domain
Tables begin with the game_ prefix. games is the canonical root table (no prefix on root).
•   game_answers
•   game_attempts
•   game_question_options
•   game_scores
•   game_users
•   games

Admin Domain
Tables use descriptive names without prefixes.
•	admin_users
•	roles
•	user_roles
•	admin_action_logs 
•	contributors

Column Naming
Electrum uses consistent column naming across all tables.

Primary Keys
•	id — always UUID

Foreign Keys
•	{domain}_id Examples:
•	city_id
•	entity_id
•	place_id
•	moment_id
•	era_id
•	story_id

Slugs
•	slug — text, unique per city

Timestamps
•	created_at
•	updated_at (only on core tables)

Geospatial Columns
•	latitude
•	longitude
NOTE: Panorama-space coordinates use pan_x and pan_y (numeric, 0.0–1.0), not latitude/longitude. These are normalized 2D positions within an equirectangular image and must not be confused with real-world geospatial coordinates.

Narrative Columns
•	title
•	description

Relationship Columns
•	source_type
•	source_id
•	target_type
•	target_id
•	relationship_type

Join Table Naming
Join tables follow a strict pattern:
Code
{source}_{target}
Examples:
•	event_eras
•	moment_places
•	moment_entities
If multiple join tables exist for the same pair, suffix with _links.
Example:
•	moment_places

Pluralization Rules
Electrum uses plural table names and singular column names.
Examples:
•	Table: civic_events
•	Column: event_id
This rule is universal.

Naming Rules Summary
•	Tables: snake_case, plural
•	Columns: snake_case, singular
•	Join tables: {source}_{target}
•	Relationship graph: civic_relationships
•	City tables: city_*
•	Civic tables: civic_*
•   	Sponsor tables (active): sponsorship_*, sponsor_*, creative_assets, sponsors
•   	Sponsor tables (deprecated): ad_*
•	Gaming tables: game_*
•	Admin tables: descriptive names
•	Slugs: slug
•	Timestamps: created_at, updated_at

## 6. Foreign Key Map

### 6.1 City Domain Foreign Keys
Cities
•	cities.id → all civic tables
•	cities.id → city_brand_settings.city_id
•	cities.id → city_design_system.city_id
•	cities.id → city_feature_toggles.city_id
•	cities.id → city_navigation.city_id
•	cities.id → city_prompts.city_id
•	cities.id → city_safety_settings.city_id
•	cities.id → city_freeze_events.city_id
•	cities.id → games.city_id
•	cities.id → civic_object_page_settings.city_id
•	cities.id → story_page_settings.city_id

### 6.2 Civic Content Foreign Keys
All civic content tables follow the same FK pattern:
Civic Content → Cities
•	civic_events.city_id → cities.id
•	civic_eras.city_id → cities.id
•	civic_stories.city_id → cities.id
•	civic_places.city_id → cities.id
•	civic_entities.city_id → cities.id
•	civic_moments.city_id → cities.id
•	civic_neighborhoods.city_id → cities.id
•	civic_artifacts.city_id → cities.id
This is the backbone of Electrum’s civic memory model.

### 6.3 Relationship Table Foreign Keys
Generalized Relationship Graph
•	civic_relationships.city_id → cities.id
•	civic_relationships.source_id → any civic table
•	civic_relationships.target_id → any civic table
Specialized Join Tables
•	event_eras.event_id → civic_events.id
•	event_eras.era_id → civic_eras.id
•	moment_entities.moment_id → civic_moments.id
•	moment_entities.entity_id → civic_entities.id
•	moment_eras.moment_id → civic_moments.id
•	moment_eras.era_id → civic_eras.id
•	moment_places.moment_id → civic_moments.id
•	moment_places.place_id → civic_places.id
•	moment_stories.moment_id → civic_moments.id
•	moment_stories.story_id → civic_stories.id
•	moment_neighborhoods.moment_id → civic_moments.id
•	moment_neighborhoods.neighborhood_id → civic_neighborhoods.id

### 6.4 Sponsor Domain Foreign Keys

Active tables:
•   sponsor_profiles.sponsor_id → sponsors.id (UNIQUE; CASCADE DELETE)
•   sponsorship_campaigns.sponsor_id → sponsors.id
•   sponsorship_campaigns.city_id → cities.id
•   sponsorship_campaigns.created_by → admin_users.id
•   sponsorship_placements.campaign_id → sponsorship_campaigns.id (CASCADE DELETE)
•   sponsorship_placements.city_id → cities.id
•   creative_assets.sponsor_id → sponsors.id
•   creative_assets.campaign_id → sponsorship_campaigns.id (CASCADE DELETE)

Deprecated tables (preserved; do not use in new code):
•   ad_creatives.slot_id → ad_slots.id           — DEPRECATED
•   ad_creatives.sponsor_id → sponsors.id        — DEPRECATED
•   ad_impressions.creative_id → ad_creatives.id — not required for launch
•   ad_clicks.creative_id → ad_creatives.id      — not required for launch

### 6.5 Gaming Domain Foreign Keys
•   game_question_options.game_id → games.id
•   game_answers.question_id → game_question_options.id
•   games.city_id → cities.id (nullable for global games)
•   game_attempts.game_id → games.id
•   game_attempts.game_user_id → game_users.id
•   game_scores.attempt_id → game_attempts.id
•   game_scores.game_user_id → game_users.id
•   game_users.user_id → auth.users.id (SET NULL on delete)
•   game_users.city_id → cities.id
•   civic_object_page_settings.city_id → cities.id
•   story_page_settings.city_id → cities.id
•   story_page_settings.civic_story_id → civic_stories.id (ON DELETE CASCADE)
•   civic_object_page_settings.civic_object_id → civic_* table selected by civic_object_type (polymorphic; validated by publish trigger)

### 6.6 Admin Domain Foreign Keys
•	admin_users.role_id → roles.id
•	user_roles.user_id → admin_users.id
•	user_roles.role_id → roles.id
•	payout_batch_items.civic_story_id → civic_stories.id
•	payout_batch_items.production_unit_id → production_units.id
•	payout_batch_items.payee_id → admin_users.id
•	civic_stories.author_name → admin_users.id
•	sponsor_allocations.created_by → admin_users.id

### 6.7 Immersive Media Domain Foreign Keys
panoramas.city_id         → cities.id
panoramas.civic_object_id → civic_[type].id  (polymorphic; resolved by civic_object_type)
panoramas.created_by      → admin_users.id
panoramas.updated_by      → admin_users.id

hotspots.panorama_id      → panoramas.id  (CASCADE DELETE)
hotspots.city_id          → cities.id
hotspots.target_id        → civic_[type].id | civic_stories.id | panoramas.id
                            (polymorphic; resolved by target_type)
hotspots.created_by       → admin_users.id
hotspots.updated_by       → admin_users.id

### 6.8 Search Domain Foreign Keys

The search subsystem uses a single table, `search_index`, which stores normalized, ranked, ADA‑safe metadata for all searchable civic content.

All foreign keys in this domain follow strict city‑scoping and polymorphic‑entity rules.

**Search Index**
• search_index.city_id → cities.id  
    - Required.  
    - All search is city‑scoped in v1.  
    - City identity is derived from hostname, not from URL path segments.  

• search_index.entity_id → civic_[type].id | games.id | contributors.id  
    - Polymorphic.  
    - The `entity_type` column determines which source table the FK refers to.  
    - Valid entity_type values:  
        'story', 'object', 'timeline', 'codex', 'game', 'city', 'contributor'  
    - Enforced by `search_index_entity_type_check`.  

 **Route Field**
 • search_index.route  
    - Not an FK.  
    - Absolute pathname beginning with `/`.  
    - Never includes a citySlug prefix.  
    - Constructed by `rpc_reindex_entity` according to SEARCH_ROUTING_GUIDE.  

 **Indexing Triggers**
 • All civic content tables (stories, objects, events, places, moments, artifacts, neighborhoods, eras, contributors, games) must call `rpc_reindex_entity` on INSERT, UPDATE, DELETE.  
     - Populates: entity_type, entity_id, city_id, title, subtitle, summary, keywords, thumbnail_url, route, search_vector, entity_weight, is_published, facet, source_updated_at, indexed_at.  

 **RLS**
 • Anon role may SELECT only rows where is_published = true.  
 • Draft/unpublished rows are excluded from anon queries.  
 • Search subsystem is sponsorship‑independent; no sponsor FK exists.  

 **Uniqueness**
 • search_index(entity_type, entity_id, facet) is UNIQUE.  
     - Ensures one row per facet per entity.  
     - Supports multi‑facet indexing (e.g., codex facet for eras).  

## 7. RLS Model
Electrum uses a strict Role Level Security (RLS) model to protect administrative data, ensure public safe access to civic content, and enforce domain boundaries. All public queries run under the anon role. All admin operations run under authenticated roles or the Supabase service role.

### 7.1 Public UI (anon role)
The anon role powers all public pages. It must be able to read city configuration and civic content, but must not access administrative or sensitive tables.
Anon CAN SELECT:

City tables
o	cities
o	city_brand_settings
o	city_design_system
o	city_feature_toggles
o	city_navigation
o	city_prompts
o	city_safety_settings
o	city_freeze_events

Civic content tables
o	civic_entities
o	civic_events
o	civic_places
o	civic_stories
o	civic_moments
o	civic_eras
o	civic_neighborhoods
o	civic_artifacts

Page configuration tables
o	civic_object_page_settings (public SELECT limited to allowlisted presentation/SEO columns)
o	story_page_settings (public SELECT limited to allowlisted presentation/SEO columns)

Relationship tables
o	civic_relationships
o	event_eras
o	moment_entities
o	moment_places
o	moment_eras
o	moment_stories
o	moment_neighborhoods

Search tables
o search_index   (WHERE is_published = true)
       – anon may only see published rows
       – draft/unpublished rows are excluded via RLS
       – sponsorship‑independent: no sponsor fields, no sponsor FK
       – routes are domain‑based; no citySlug prefixes

Sponsor tables (limited)
o  anon CAN SELECT:
     ▪  sponsorship_placements (WHERE is_active = true only)
o  anon CANNOT SELECT directly:
     ▪  sponsors
     ▪  sponsor_profiles
     ▪  sponsorship_campaigns
     ▪  creative_assets              (served via rpc_get_active_sponsorships)
     ▪  ad_slots                     (deprecated)
     ▪  ad_creatives                 (deprecated)
     ▪  ad_impressions               (not required for launch)
     ▪  ad_clicks                    (not required for launch)

Immersive media tables (limited)
o  	anon CAN SELECT:
       panoramas  (where status = 'published')
       hotspots   (where is_active = true AND parent panorama status = 'published')

Gaming tables (limited)
o	anon CAN SELECT:
	games
	game_question_options
	game_answers
Only active games are visible. Game attempts and scores are never available to anon.
o	anon CANNOT SELECT:
	game_attempts
	game_scores

Anon CANNOT SELECT:
•	All admin tables
•	All fraud tables
•	All audit logs
•	All global settings tables
•	All contributor tables
•	All sensitive sponsor tables
•	All gaming attempt/score tables
This ensures the public UI is fully safe.

### 7.2 Admin UI (authenticated admin users)
Authenticated admin users operate under the authenticated role and have full CRUD access to all admin level tables.
Admin CAN:
•	SELECT / INSERT / UPDATE / DELETE
o	Admin tables
o	Sponsor tables
o	Gaming attempt tables
o	Civic content tables
o	City configuration tables
o  	Immersive media tables
       		panoramas
       		hotspots
Admins bypass public restrictions but still operate under RLS policies that grant elevated access.

### 7.3 Contributors (limited authenticated role)
Contributors are authenticated users with restricted write access.
Contributors CAN:
•	SELECT all civic content
•	INSERT/UPDATE civic content (depending on your policy)
•	CANNOT access admin tables
•	CANNOT access fraud or audit tables
•	CANNOT modify global settings
•	CANNOT modify sponsor or gaming tables
This role is designed for editorial workflows.

### 7.4 Service Role (Supabase backend)
The service role bypasses RLS entirely.
It is used for:
•	Admin UI server actions
•	Internal Supabase functions
•	Scheduled jobs
•	Secure backend operations
The service role is never exposed to the public UI.

### 7.5 Production Units
#### 7.5.a RLS: Production Units (production_units)

Purpose

Protect financial deliverables and ensure only authorized users can submit, review, publish, or modify production units.
Policies

Contributors

USING (auth.uid() = contributor_id)
•  CAN: SELECT their own units
•  CAN: INSERT new units (story, photo, caption)
•  CANNOT: update status beyond submitted

Editors

USING (auth.uid() = editor_id)
•	CAN: SELECT units they review
•	CAN: UPDATE status → editor_approved
•	CANNOT: publish
City Admins
•	CAN: SELECT all units for their cities
•	CAN: UPDATE status → city_published
•	CAN: adjust amount_cents downward
•	CANNOT: modify contributor_id or editor_id
CEO
•	Full access

#### 7.5.b RLS: Payout Batches (payout_batches)

Purpose

Ensure City Admins can confirm payouts for their cities, while CEO retains final authorization.
Policies

City Admins
•	CAN: SELECT batches for their cities
•	CAN: UPDATE status → city_confirmed
•	CANNOT: authorize payouts

CEO
•	CAN: UPDATE status → ceo_authorized
•	CAN: UPDATE status → paid

Contributors / Editors
•	CAN: SELECT their own batches
•	CANNOT: update

#### 7.5.c RLS: Payout Batch Items (payout_batch_items)

Purpose

Protect payout line items and ensure they cannot be manipulated outside the batch workflow.
Policies

City Admins
•	CAN: SELECT items for their cities
•	CANNOT: INSERT/UPDATE/DELETE (must use RPCs)

CEO
•	Full access

Contributors / Editors
•	CAN: SELECT items belonging to their batches
•	CANNOT: modify

#### 7.5.d RLS: City Budget (city_budget)

Purpose

Prevent overspend and ensure City Admins can see their budget.
Policies

City Admins
•	CAN: SELECT
•	CANNOT: UPDATE

CEO
•	Full access

#### 7.5.e RLS: Publication Gate (civic_stories)

Purpose

Enforce the editorial workflow: Editors approve, City Admins publish.

Policies

Editors
USING (auth.uid() = editor_id)
•	CAN: UPDATE review fields
•	CAN: UPDATE review_status → approved
•	CANNOT: set is_published = true

City Admins
USING (city_id = ANY(
  SELECT city_ids FROM admin_users WHERE auth_uid() = admin_users.auth_uid
))
•	CAN: UPDATE is_published = true
•	CAN: UPDATE published_at
•	CANNOT: modify review fields

CEO
•	Full access

### 7.6 Object Ingestion

raw_ingestion
CREATE POLICY raw_ingestion_ceo_only
  ON raw_ingestion
  FOR ALL
  USING (auth.role() = 'ceo');


civic_object_suggestions
ALTER TABLE public.civic_object_suggestions
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY civic_object_suggestions_city_admin_select
  ON public.civic_object_suggestions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role')
      IN ('city_admin', 'ceo')
  );

CREATE POLICY civic_object_suggestions_city_admin_insert
  ON public.civic_object_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role')
      IN ('city_admin', 'ceo')
  );

CREATE POLICY civic_object_suggestions_city_admin_update
  ON public.civic_object_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role')
      IN ('city_admin', 'ceo')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role')
      IN ('city_admin', 'ceo')
  );

### 7.7 RLS Summary
•	anon → read only civic + city + limited sponsor + limited gaming
•	authenticated admin → full CRUD everywhere
•	authenticated contributor → limited CRUD on civic content
•	service role → full bypass
This model ensures:
•	public safety
•	editorial flexibility
•	admin control
•	sponsor integrity
•	gaming privacy
•	Workspace stability

### 7.8 
RLS: Immersive Media (panoramas, hotspots)
panoramas
-- anon read: published only
CREATE POLICY panoramas_anon_read ON public.panoramas
  FOR SELECT TO anon
  USING (status = 'published');

-- city_admin: full CRUD for own cities
CREATE POLICY panoramas_city_admin ON public.panoramas
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users
      WHERE auth_uid = auth.uid()::text
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users
      WHERE auth_uid = auth.uid()::text
    )
  );

-- CEO: unrestricted
CREATE POLICY panoramas_ceo ON public.panoramas
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ceo')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ceo');

hotspots
-- anon read: active hotspots on published panoramas only
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

-- city_admin: full CRUD for own cities
CREATE POLICY hotspots_city_admin ON public.hotspots
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users
      WHERE auth_uid = auth.uid()::text
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users
      WHERE auth_uid = auth.uid()::text
    )
  );

-- CEO: unrestricted
CREATE POLICY hotspots_ceo ON public.hotspots
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ceo')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ceo');

RLS: Sponsorship Tables

sponsorship_campaigns
```sql
-- anon blocked entirely; public access via RPC only
CREATE POLICY campaigns_anon_block ON public.sponsorship_campaigns
  FOR SELECT TO anon USING (false);

-- City Admin + CEO: city-scoped full CRUD
CREATE POLICY campaigns_admin ON public.sponsorship_campaigns
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin','ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users WHERE auth_uid = auth.uid()::text
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin','ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users WHERE auth_uid = auth.uid()::text
    )
  );
```

sponsorship_placements
```sql
-- anon: active placements only
CREATE POLICY placements_anon_read ON public.sponsorship_placements
  FOR SELECT TO anon
  USING (is_active = true);

-- City Admin + CEO: city-scoped full CRUD
CREATE POLICY placements_admin ON public.sponsorship_placements
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin','ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users WHERE auth_uid = auth.uid()::text
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin','ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users WHERE auth_uid = auth.uid()::text
    )
  );
```

creative_assets
```sql
-- anon blocked; served via SECURITY DEFINER RPC only
CREATE POLICY assets_anon_block ON public.creative_assets
  FOR SELECT TO anon USING (false);

-- City Admin + CEO full CRUD (city scoped via campaign join; simplified here)
CREATE POLICY assets_admin ON public.creative_assets
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin','ceo'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin','ceo'));
```

sponsor_profiles
```sql
CREATE POLICY profiles_anon_block ON public.sponsor_profiles
  FOR SELECT TO anon USING (false);

-- CEO only for full CRUD; City Admin SELECT only
CREATE POLICY profiles_ceo ON public.sponsor_profiles
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ceo')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ceo');

CREATE POLICY profiles_city_admin_select ON public.sponsor_profiles
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'city_admin');
```

Access summary

| Role        | sponsorship_campaigns | sponsorship_placements      | creative_assets      | sponsor_profiles     |
|-------------|-----------------------|-----------------------------|----------------------|----------------------|
| anon        | ✗                     | SELECT active rows only      | ✗ (via RPC)          | ✗                    |
| city_admin  | CRUD (own city)       | CRUD (own city)             | SELECT (own city)    | SELECT only          |
| ceo         | Full CRUD             | Full CRUD                   | Full CRUD            | Full CRUD            |
| contributor | ✗                     | ✗                           | ✗                    | ✗                    |

---

### 7.9 RLS: game_users

```sql
-- anon: insert guest row; select own row via session_token
CREATE POLICY game_users_anon_insert ON public.game_users
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND session_token IS NOT NULL);

CREATE POLICY game_users_anon_select ON public.game_users
  FOR SELECT TO anon
  USING (session_token = current_setting('app.session_token', true));

-- authenticated: full access to own row
CREATE POLICY game_users_authenticated ON public.game_users
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- admin: city-scoped SELECT
CREATE POLICY game_users_admin ON public.game_users
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin','ceo')
  );
```

---


## 8. Query Model

Electrum’s query model is divided into Public Queries (anon role) and Admin Queries (authenticated or service role). Public queries must respect RLS and use the platform’s canonical loader functions. Admin queries may bypass RLS via the service role.

### 8.1 Public Queries (anon role)

Public pages load civic content through a small set of canonical loaders. These loaders enforce RLS, scope all queries by city_id, and ensure consistent Supabase access patterns.

Story Page
Loads narrative content and its connected civic objects.
•	civic_stories
•	civic_moments
•	civic_places
•	civic_entities

Event Page
Loads historical content and its temporal relationships.
•	civic_events
•	civic_eras
•	civic_moments

Object Page / Panorama Viewer
Loads immersive media and its interactive markers.
•  	panoramas   (where civic_object_id + civic_object_type match; status = 'published'; ordered by display_order)
•  	hotspots    (where panorama_id = primary panorama; is_active = true)

Object Page — loads civic object details, immersive media, and editorial context.
• civic_[type]                     (primary object; resolved by object_type)
• panoramas                        (WHERE civic_object_id + civic_object_type match AND status = 'published'; ORDER BY display_order)
• hotspots                         (WHERE panorama_id = primary panorama AND is_active = true)
• civic_stories                    (WHERE is_published = true AND safety_hold = false AND object id IN related_*_ids)
• civic_object_page_settings       (server-side loader; anon gets allowlisted columns only)

Place Page
Loads spatial content and its narrative connections.
•	civic_places
•	civic_moments
•	civic_entities

Atlas
Loads spatial and neighborhood content.
•	cities
•	civic_places
•	civic_neighborhoods

Timeline
Loads temporal content.
•	civic_events
•	civic_eras
•	civic_moments

Search
Loads indexed civic content through the canonical search API route.
Public UI must never call rpc_search directly — all search flows through /api/search.

• /api/search?q=[query]&type=[entity_type]&limit=[n]&offset=[n]
     – Validates city context via deriveCityFromHostname()
     – Calls rpc_search via service‑role client
     – Returns SearchResponse (normalized by normalizeSearchResponse)

 • search_index (WHERE is_published = true)
     – Anon SELECT permitted only for published rows
     – Routes are domain‑based (no citySlug prefix)
     – Contains title, subtitle, summary, keywords, thumbnail_url, route
     – Used exclusively through /api/search; never queried directly by components

Public search loaders must:
     – Use useSearch for client‑side state
     – Use normalizeSearchResponse for result normalization
     – Never include sponsor, campaign, or placement parameters
     – Never render sponsorship components on the search page

Sponsor Slot
Loads active sponsorship placements and creative assets for a city surface. Public loaders
must use rpc_get_active_sponsorships — never query sponsorship tables directly from the
public UI.

•  rpc_get_active_sponsorships(city_id, page_type) — returns placements + assets (SECURITY DEFINER)
•  sponsorship_placements (WHERE is_active = true) — anon SELECT permitted
•  creative_assets — served through RPC only; not directly accessible to anon

Deprecated (do not use in new code):
•  ad_slots
•  ad_creatives

Games
Loads trivia content.
•	games
•	game_question_options
•	game_answers

### 8.2 Public Loader Functions

All public queries must use the canonical loaders:
•	loadCityBySlug
•	loadCityAndPage
•	loadTimeline

These loaders enforce:
•	RLS
•	city scoping
•	consistent Supabase client usage
•	safe joins
•	predictable caching

Workspace relies on these loaders to normalize public data access.

### 8.3 Admin Queries (authenticated or service role)

Admin queries may bypass RLS and access sensitive tables. These queries are used by the admin dashboard, fraud detection, and global configuration systems.

Admin Queries Include:
•	fraud_rules
•	fraud_signals
•	fraud_contributor_state
•	audit_logs
•	security_audit_log
•	global_settings
•	global_feature_toggles
•	global_permissions
•	admin_users
•	contributors

Admin UI
The Admin UI may query directly using the Supabase service role. This bypasses RLS and allows full CRUD operations.

8.4 Query Model Summary
•	Public UI → anon role → must use canonical loaders
•	Admin UI → authenticated or service role → may query directly
•	Public queries → civic + city + limited sponsor + limited gaming
•	Admin queries → full access to admin, fraud, audit, global settings

This model ensures:
•	public safety
•	editorial flexibility
•	admin control
•	sponsor integrity
•	gaming privacy
•	Workspace stability

## 9. Storage Model (Unified)

Electrum uses one canonical bucket, currently in Supabase:
universal-media

All assets — brand, hero, logo, stories, events, places, entities, moments — are stored here.

The folder structure is:
universal-media/
	cities/<cityId>/brand/
	cities/<cityId>/stories/
	cities/<cityId>/events/
	cities/<cityId>/places/
	cities/<cityId>/entities/
	cities/<cityId>/moments/
	cities/<cityId>/panoramas/ 
	sponsorships/<sponsorId>/campaigns/<campaignId>/
Legacy buckets (story-360, story-images, ad-banners, etc.) remain but are deprecated.

All new uploads must use universal-media.

## 10. Security Logging Model

Core tables: security_audit_log, admin_action_logs.

Electrum uses a centralized, immutable security logging system to record all administrative actions across the platform. This ensures accountability, auditability, and compliance for all city level and global configuration changes.

Security logging is handled exclusively through:
•	security_audit_log — Security-critical actions (logins, logouts, password changes, login attempts, etc) 
•	admin_action_logs — All 

Admin operational actions (publish, approve, budget, brand, etc)

These tables record who performed an action, what was changed, which table was affected, and when the action occurred.

Security logging is not implemented by scattering timestamps or metadata across every admin restricted table. Instead, all logs are written to security_audit_log using a consistent schema.

### 10.1 Canonical Audit Tables: 

Table: admin_action_logs 

Purpose: All City Admin operational actions (publish, approve, budget, brand).

Every admin restricted mutation (INSERT, UPDATE, DELETE) must generate a log entry in this table.

Schema Columns
  id uuid not null default gen_random_uuid (),
  actor_user_id uuid null,
  actor_admin_id uuid null,
  actor_role text not null,
  action text not null,
  domain text not null,
  entity_type text null,
  entity_id uuid null,
  target_user_id uuid null,
  metadata jsonb null,
  ip_address inet null,
  user_agent text null,
  created_at timestamp with time zone not null default now(),
  constraint admin_action_logs_pkey primary key (id),
  constraint admin_action_logs_actor_user_id_fkey foreign KEY (actor_user_id) references auth.users (id) on delete set null,
  constraint admin_action_logs_target_user_id_fkey foreign KEY (target_user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_admin_action_logs_actor_user_id on public.admin_action_logs using btree (actor_user_id) TABLESPACE pg_default;

create index IF not exists idx_admin_action_logs_domain_created_at on public.admin_action_logs using btree (domain, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_admin_action_logs_entity_type_entity_id on public.admin_action_logs using btree (entity_type, entity_id) TABLESPACE pg_default;

create index IF not exists idx_admin_action_logs_target_user_id on public.admin_action_logs using btree (target_user_id) TABLESPACE pg_default;

Metadata Examples
•	Fields changed
•	Old values vs new values
•	Publish/draft status transitions
•	City affected
•	IP address (optional)
•	Admin UI route used

Use for:
•	Admin login / logout events
•	Role changes (global or city scoped)
•	Password resets / security policy changes
•	RLS policy updates (if exposed via admin tooling)

Table: audit_logs

Purpose: general admin actions on entities.

Schema Columns
column_name	data_type
id	Uuid
actor_user_id	Uuid
action	Text
entity_type	Text
entity_id	Uuid
metadata	jsonb
created_at	timestamp with time zone

Use for:
•	Admin mutations on:
o	admin tables (admin_users, roles, user_roles, contributors, platform_settings, profiles)
o	city configuration (cities, city_brand_settings, city_design_system, city_feature_toggles, city_navigation, city_prompts, city_safety_settings, city_freeze_events)
o	fraud tables (fraud_rules, fraud_signals, fraud_contributor_state)
o	global settings (global_*)
o	sponsor tables (sponsors, ad_slots, ad_creatives, ad_impressions, ad_clicks)
o	gaming admin tables (games, game_question_options, game_answers, game_attempts, game_scores when mutated by admin)
o	editorial workflows (civic_stories, civic_events, etc. when edited via admin/editor UI)

### 10.2 What Gets Logged

Keep updated_at on admin tables for normal data lifecycle and UI convenience.

Centralize security logging in security_audit_log and audit_logs, not scattered across every table.

All admin restricted mutations (INSERT/UPDATE/DELETE) must generate a log entry.

This includes:

•	City configuration
o	cities
o	city_brand_settings
o	city_design_system
o	city_feature_toggles
o	city_navigation
o	city_prompts
o	city_safety_settings
o	city_freeze_events

•	Global configuration
o	global_settings
o	global_brand_settings
o	global_feature_toggles
o	global_permissions
o	global_safety_settings

•   Sponsor system
o  	sponsors
o  	sponsor_profiles
o  	sponsorship_campaigns
o  	sponsorship_placements
o  	creative_assets
o  	ad_slots                (deprecated; log if still mutated)
o  	ad_creatives            (deprecated; log if still mutated)

•   Games system 
o  	creating a game
o	editing a game
o	deleting a game
o	editing game questions
o	editing game answers
o	editing scoring rules
o	editing game metadata
o	editing game_users

•	Contributor/editor system
o	contributors
o	admin_users
o	roles
o	user_roles

•	Fraud/safety system
o	fraud_rules
o	fraud_signals
o	fraud_contributor_state

•	Relationship tables
o	event_eras
o	moment_entities
o	moment_places
o	moment_eras
o	moment_stories
o	moment_neighborhoods

If an admin can mutate it, it must be logged.

### 10.3 What Does Not Get Logged
Some tables should not generate audit entries:
•	security_audit_log (self referential logging is forbidden)
•	audit_logs (self referential logging is forbidden)
•	rate_limit_events
•	ai_usage_logs
•	ai_response_cache
•	game_attempts
•	game_scores
•	ad_impressions
•	ad_clicks
These tables are either:
•	append only logs
•	automated system tables
•	non admin editable
•	high volume telemetry tables

### 10.4 Table Level Metadata Requirements
Security logging is centralized, but certain tables still require lifecycle metadata:
Configuration Tables (full metadata)
Must include:
•	updated_at
•	updated_by
•	status (draft/published)
•	last_modified_at
•	last_modified_by
•	last_published_at
•	last_published_by
Civic Content Tables (editorial metadata)
Must include:
•	updated_at
•	updated_by
•	is_published
•	review_status
•	editor_id
•	reviewed_at
System Tables (no metadata)
Must not include:
•	updated_by
•	status
•	publish timestamps

### 10.5 How Logs Are Generated
Admin UI
All admin UI mutations must:
1.	Perform the database mutation using the service role
2.	Write a corresponding entry into security_audit_log
3.	Include a structured diff in metadata
Supabase Functions / Triggers (optional)
For high risk tables (global settings, fraud rules), triggers may also write logs automatically.
Workspace Enforcement
Workspace must:
•	ensure all admin routes write audit entries
•	ensure no admin mutation bypasses logging
•	ensure metadata is structured and consistent
•	ensure logs are immutable (no UPDATE/DELETE allowed)

### 10.6 RLS for logging tables
•	anon: CANNOT SELECT security_audit_log or audit_logs.
•	authenticated admin / service role: CAN SELECT and INSERT into both tables.
•	contributors: CANNOT SELECT logs; mutations they trigger (e.g., story submissions) still generate audit_logs entries with actor_user_id set.

### 10.7 Summary
Electrum’s security logging model is:
•	centralized
•	immutable
•	complete
•	consistent
•	Workspace enforced
•	launch critical
Every admin action is logged. Every log is structured. Every log is immutable. Every log is stored in security_audit_log.

## 11. Draft/Publish Model
Each city may have one draft row and one published row in both
`city_brand_settings` and `city_design_system`:

`city_brand_settings`:
  city_id: <uuid>
  status: "draft"
  ...
`city_brand_settings`:
  city_id: <uuid>
  status: "published"
  ...

`city_design_system`:
  city_id: <uuid>
  status: "draft"
  ...

`city_design_system`:
  city_id: <uuid>
  status: "published"
  ...

### 11.1 Publish Action

Publishing copies draft → published:
INSERT INTO city_brand_settings (city_id, status, ...)
SELECT city_id, 'published', ...
FROM city_brand_settings
WHERE city_id = $1 AND status = 'draft';
Same for design system.
Preview mode loads draft. Public UI loads published.

### 11.2 Preview Architecture
Admin Preview Route: 
/workspaces/electrumbroadcasting-admin/app/admin/cities/[id]/preview
Public UI Preview Mode: 
/workspaces/electrum-broadcasting/electrum-ui/cities/[id]?preview=true
Preview loads:
•	brand (draft)
•	design system (draft)
•	pages (draft)
•	modules (draft)
Live site loads:
•	brand (published)
•	design system (published)
•	pages (published)
•	modules (published)

### 11.3 Public UI Loaders 
Brand

loadBrandSettings(cityId, { draft: boolean })

Design System

loadDesignSystem(cityId, { draft: boolean })
Pages

loadCityPages(cityId, { draft: boolean })

Modules

loadCityModules(cityId, { draft: boolean })
All loaders must use:
•	anon Supabase client
•	RLS-safe queries
•	shared slug resolution (loadCityBySlug)

## 12. AI Ingestion 

Purpose:
Automated ingestion, normalization, enrichment, suggestion generation, media binding, and curation of civic objects.

### 12.1 Tables:
•	raw_ingestion
•	civic_object_suggestions
•	ingestion columns in civic_* tables

### 12.2 Actors:
•	ingestion workers
•	City Admins
•	CEO

### 12.3 Outputs:
•	normalized civic objects
•	enriched metadata
•	AI suggestions
•	ingestion logs
•	360° media bindings

### 12.4 Boundaries:
•	Does not modify editorial workflows
•	Does not modify payout workflows
•	Does not modify sponsor workflows
•	Does not modify theme/brand workflows

## 13. Workspace Responsibilities

Workspace is responsible for enforcing Electrum’s architectural rules, normalizing data access, and refactoring code to match the platform’s canonical data model. Workspace must operate within the schema and RLS boundaries defined in this document.
Workspace responsibilities fall into three categories: Normalize, Verify, and Refactor.

### 13.1 Normalize

Workspace MUST normalize:
•	Supabase queries
o	consistent client usage
o	consistent RLS safe patterns
o	consistent city scoping
•	Slug loaders
o	enforce canonical loader functions
o	remove ad hoc slug queries
•	Civic content loaders
o	unify event, era, moment, place, entity, story loaders
•	Modular page loaders
o	enforce loadCityBySlug
o	enforce loadCityAndPage
o	enforce loadTimeline
Normalization ensures consistent behavior across the entire platform.

### 13.2 Verify
Workspace MUST verify:
•	Foreign keys
o	correct joins
o	correct city scoping
o	correct relationship mapping
•	RLS policies
o	anon visibility
o	contributor access
o	admin access
o	sponsor/gaming restrictions
•	Table level GRANTs
o	anon SELECT only
o	authenticated CRUD
o	service role bypass
•	Anon visibility
o	civic + city tables
o	limited sponsor tables
o	limited gaming tables
•	Service role usage
o	admin UI
o	secure backend operations
Verification ensures the platform remains safe, consistent, and RLS correct.

### 13.3 Refactor
Workspace MUST refactor:
•	Duplicated loaders
•	Inconsistent shapes
•	Mismatched slugs
•	Broken relationships
•	Dead code
•	References to dropped tables
•	Naming convention violations
•	Admin CRUD inconsistencies
•	Public loader inconsistencies
•	Supabase client misuse
•	Page level data fetching issues
•	Directory structure drift
•	Provider architecture drift
•	Type definition mismatches
•	Zod schema mismatches
•	Server action misuse
•	Caching strategy issues
Refactoring ensures the codebase aligns with Electrum’s canonical architecture.

### 13.4 Workspace SHOULD
Workspace SHOULD:
•	Normalize loaders
•	Normalize API routes
•	Enforce RLS
•	Remove dead code
•	Remove references to dropped tables
•	Consolidate relationship logic
•	Fix naming conventions
•	Fix admin CRUD
•	Fix public loaders
•	Fix Supabase client usage
•	Fix slug loaders
•	Fix page level data fetching
•	Fix directory structure
•	Fix provider architecture
•	Fix type definitions
•	Fix Zod schemas
•	Fix server actions
•	Fix caching strategy
These actions improve stability, maintainability, and architectural consistency.

### 13.5 Workspace MUST NOT
Workspace MUST NOT:
•	Create new tables
•	Modify your schema
•	Modify RLS policies
•	Generate new modules
•	Create new admin systems
•	Create new civic domains
•	Create new sponsor or game types
•	Rewrite your data model
•   	Query deprecated tables (ad_slots, ad_creatives) in any new code
•   	Bypass rpc_get_active_sponsorships for public-facing sponsorship queries
•   	Write directly to game_users.total_score or game_users.games_played (trigger-managed)
•   	Set sponsorship_placements.is_active directly (trigger-managed via campaign status)

 • Query `search_index` directly from public loaders; all public search must use `/api/search`
     – `/api/search` validates city context via hostname
     – `/api/search` calls `rpc_search` via service-role client
     – Public UI must never call `rpc_search` directly
     – Public UI must never SELECT from `search_index` directly
     – Public search must always use `useSearch` + `normalizeSearchResponse`

Workspace must operate within the schema and architectural boundaries defined in this document.
---

## 14. Audit Log Operational Reference

### 14.1 Purpose
This section consolidates the operational reference for admin_action_logs and
security_audit_log as they apply across all DATA_MODEL.md domains. It supplements
§10 (Security Logging Model) without modifying it.

### 14.2 Table Summary

| Table                | Scope                                                     | Who Writes                   | Who Reads                              |
|----------------------|-----------------------------------------------------------|------------------------------|----------------------------------------|
| admin_action_logs    | All City Admin operational actions; all CEO non-security  | Admin UI server actions;     | City Admins (city_id scoped);          |
|                      | actions.                                                  | triggers on domain tables    | CEO (all cities)                       |
| security_audit_log  | Security-critical infrastructure events only:             | Admin UI auth layer;         | CEO only                               |
|                      | auth events, role changes, permission changes,            | high-risk setting triggers   |                                        |
|                      | global settings changes, platform safety changes.         |                              |                                        |

Both tables are immutable. No UPDATE or DELETE is permitted by any role (§10.2, §10.5).

### 14.3 Canonical action Strings by Domain
The action column in admin_action_logs must use the following canonical strings.
Workspace must not introduce new action strings without a corresponding update to this
section.

| Domain     | Canonical action Values                                                                   |								
|------------|-------------------------------------------------------------------------------------------|								
| editorial  | story_published, story_unpublished, production_unit_created, tier_selected,               |								
|            | editorial_dispute_resolved, unpublishable_approved, story_escalation_handled,             |
|            | story_page_settings_edited                                                                 |
| civic      | object_approved, object_hidden, object_frozen, object_unfrozen, object_merged,            |								
|            | object_escalated, object_overridden, metadata_edited, media_uploaded,                     |								
|            | metadata_requested, media_360_requested, suggestion_accepted, suggestion_rejected,        |								
|            | escalation_resolved, page_settings_edited                                                 |
| places     | PLACE_CREATE_PENDING, PLACE_EDIT_METADATA, PLACE_HIDE, PLACE_APPROVE, PLACE_RESTORE         |
| budget     | payout_batch_created, payout_batch_item_added, payout_batch_item_removed,                 |								
|            | payout_batch_authorized, payout_batch_rejected, payout_dispute_resolved,                  |								
|            | sponsor_credit_applied                                                                    |								
| brand      | brand_draft_edited, design_draft_edited, draft_submitted_for_review,                      |								
|            | brand_published, theme_published, draft_returned_with_notes, global_brand_updated         |								
| safety     | content_flagged, safety_hold_placed, safety_hold_lifted, escalated_to_ceo,                |								
|            | harmful_content_removed, safety_enforcement_action                                        |								
| navigation   | navigation_item_created, navigation_item_updated, navigation_item_deleted, panorama_created, panorama_published, panorama_unpublished, panorama_archived, panorama_reordered, panorama_metadata_edited, hotspot_placed, hotspot_updated, hotspot_activated, hotspot_deactivated, hotspot_deleted |

| sponsorship  | campaign_created, campaign_activated, campaign_expired, campaign_terminated, placement_created, placement_activated, placement_deactivated, placement_deleted, creative_asset_uploaded, creative_asset_deleted, sponsor_validated, sponsor_profile_created, sponsor_profile_updated, brand_safety_approved, brand_safety_rejected, brand_safety_suspended, good_standing_revoked, good_standing_restored |

| games        | game_published, game_unpublished, game_question_created, game_question_updated, game_question_deleted, game_user_created |
 		
| ingestion  | naming_dispute_resolved, ingestion_source_blocked, sensitive_content_resolved             |								
| global     | global_feature_toggle_updated, global_safety_setting_updated,                             |								
|            | platform_setting_updated, role_assigned, role_revoked                                     |
| search      | search_index_entity_reindexed, search_index_entity_deleted, search_index_route_recomputed, search_index_error |
              | 
               | Notes:
               | • search_index_entity_reindexed — fired when rpc_reindex_entity updates or inserts a row
               | • search_index_entity_deleted — fired when a source record is deleted and the trigger marks is_published = false
               | • search_index_route_recomputed — fired when a slug changes and route is rebuilt
               | • search_index_error — fired when rpc_reindex_entity raises an exception (invalid slug, invalid entity_type, missing city_id, etc.)								

The domain column must match one of the domains above. entity_type must be the exact
PostgreSQL table name of the affected record.

### 14.4 RLS for Audit Tables

| Role          | admin_action_logs                       | security_audit_log               |
|---------------|-----------------------------------------|-----------------------------------|
| anon          | CANNOT SELECT                           | CANNOT SELECT                     |
| contributor   | CANNOT SELECT                           | CANNOT SELECT                     |
| city_admin    | CAN SELECT (city_id scoped)             | CANNOT SELECT                     |
| ceo           | CAN SELECT (all rows)                   | CAN SELECT (all rows)             |
| service_role  | CAN INSERT; CANNOT UPDATE/DELETE        | CAN INSERT; CANNOT UPDATE/DELETE  |

### 14.5 Naming Clarification
DATA_MODEL.md §5 (Naming Conventions, Admin Domain) lists audit_logs as a table name.
DATA_MODEL.md §10 defines admin_action_logs as the canonical operational audit table,
separate from audit_logs (§10.1, which is a secondary/legacy table with a different
schema). The "audit_log viewer" referenced in CITY_ADMIN_WORKFLOW.md §9 is a UI module
label, not a table name. Workspace must use admin_action_logs in all queries and
migrations.

### 14.6 Selection Guide: admin_action_logs vs. security_audit_log

Write to admin_action_logs when:
- The action is any operational mutation by a City Admin or CEO: publish, approve, hide,
  freeze, unfreeze, escalate, resolve, budget debit, sponsor credit, brand edit, payout
  authorization, object override, safety hold placement or removal, content flag,
  navigation change, ingestion governance.
- The affected entity is any civic, editorial, budget, brand, sponsor, safety, or
  navigation record.

Write to security_audit_log (in addition to admin_action_logs) ONLY when:
- The event is an authentication event: login, logout, login_failed, mfa_event.
- The event changes a credential: password_changed.
- The event changes a role assignment: role_assigned, role_revoked.
- The event changes a permission set: permission_changed.
- The event changes a global setting: global_feature_toggle_updated,
  global_safety_setting_updated, platform_setting_updated, platform_safety_changed.

Operational safety actions (safety_hold_placed, safety_hold_lifted, content_flagged,
escalated_to_ceo, harmful_content_removed) are written to admin_action_logs only.
They are NOT security-critical infrastructure events and do NOT belong in
security_audit_log.

---

## 15. Sponsorship & Games Triggers

### 15.1 Trigger Summary

| Trigger                            | Table                      | Event                    | Effect                                                                       |
|------------------------------------|----------------------------|--------------------------|------------------------------------------------------------------------------|
| trg_activate_placements            | sponsorship_campaigns      | AFTER UPDATE OF status   | Sets is_active = true on all child placements when status → 'active'         |
| trg_expire_placements              | sponsorship_campaigns      | AFTER UPDATE OF status   | Sets is_active = false on all child placements when status → 'expired'/'terminated' |
| trg_validate_sponsor_on_activate   | sponsorship_campaigns      | BEFORE UPDATE OF status  | Blocks activation if brand_safety_status ≠ 'approved' or good_standing_status = false |
| trg_sync_campaign_city_to_placements | sponsorship_placements   | BEFORE INSERT/UPDATE     | Enforces placement city_id matches parent campaign city_id                   |
| trg_auto_create_sponsor_profile    | sponsors                   | AFTER INSERT             | Creates sponsor_profiles row with defaults ON CONFLICT DO NOTHING            |
| trg_game_users_score_counter       | game_scores                | AFTER INSERT             | Increments game_users.total_score by new score value                         |
| trg_game_users_attempt_counter     | game_attempts              | AFTER INSERT             | Increments game_users.games_played by 1                                      |
| trg_sponsorship_updated_at         | sponsorship_campaigns, sponsorship_placements, creative_assets, sponsor_profiles | BEFORE UPDATE | Sets updated_at = NOW() |

### 15.2 Trigger Definitions

```sql
-- ─── ACTIVATE PLACEMENTS ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION activate_sponsorship_placements()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status <> 'active' THEN
    UPDATE sponsorship_placements
    SET    is_active  = true,
           updated_at = NOW()
    WHERE  campaign_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activate_placements
  AFTER UPDATE OF status ON sponsorship_campaigns
  FOR EACH ROW EXECUTE FUNCTION activate_sponsorship_placements();


-- ─── EXPIRE / TERMINATE PLACEMENTS ────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_sponsorship_placements()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('expired','terminated')
     AND OLD.status NOT IN ('expired','terminated') THEN
    UPDATE sponsorship_placements
    SET    is_active  = false,
           updated_at = NOW()
    WHERE  campaign_id = NEW.id
      AND  is_active   = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_expire_placements
  AFTER UPDATE OF status ON sponsorship_campaigns
  FOR EACH ROW EXECUTE FUNCTION expire_sponsorship_placements();


-- ─── VALIDATE SPONSOR BEFORE ACTIVATION ───────────────────────────────────
CREATE OR REPLACE FUNCTION validate_sponsor_on_activate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_safety  text;
  v_standing boolean;
BEGIN
  IF NEW.status = 'active' AND OLD.status <> 'active' THEN
    SELECT brand_safety_status, good_standing_status
    INTO   v_safety, v_standing
    FROM   sponsor_profiles
    WHERE  sponsor_id = NEW.sponsor_id;

    IF v_safety IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION
        'Campaign activation blocked: brand_safety_status = % (must be approved)',
        COALESCE(v_safety, 'MISSING');
    END IF;

    IF v_standing IS DISTINCT FROM true THEN
      RAISE EXCEPTION
        'Campaign activation blocked: good_standing_status = false';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_sponsor_on_activate
  BEFORE UPDATE OF status ON sponsorship_campaigns
  FOR EACH ROW EXECUTE FUNCTION validate_sponsor_on_activate();


-- ─── ENFORCE PLACEMENT CITY MATCHES CAMPAIGN CITY ─────────────────────────
CREATE OR REPLACE FUNCTION sync_placement_city()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT city_id INTO NEW.city_id
  FROM   sponsorship_campaigns
  WHERE  id = NEW.campaign_id;

  IF NEW.city_id IS NULL THEN
    RAISE EXCEPTION 'placement.campaign_id % not found', NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_campaign_city_to_placements
  BEFORE INSERT OR UPDATE OF campaign_id ON sponsorship_placements
  FOR EACH ROW EXECUTE FUNCTION sync_placement_city();


-- ─── AUTO-CREATE sponsor_profiles ON sponsors INSERT ──────────────────────
CREATE OR REPLACE FUNCTION auto_create_sponsor_profile()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO sponsor_profiles (sponsor_id, organization_name, contact_email)
  VALUES (NEW.id, NEW.name, COALESCE(NEW.contact_email, ''))
  ON CONFLICT (sponsor_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_sponsor_profile
  AFTER INSERT ON sponsors
  FOR EACH ROW EXECUTE FUNCTION auto_create_sponsor_profile();


-- ─── GAME USERS SCORE COUNTER ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_game_user_score()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE game_users
  SET    total_score = total_score + NEW.score,
         updated_at  = NOW()
  WHERE  id = NEW.game_user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_game_users_score_counter
  AFTER INSERT ON game_scores
  FOR EACH ROW EXECUTE FUNCTION increment_game_user_score();


-- ─── GAME USERS ATTEMPT COUNTER ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_game_user_attempts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE game_users
  SET    games_played = games_played + 1,
         updated_at   = NOW()
  WHERE  id = NEW.game_user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_game_users_attempt_counter
  AFTER INSERT ON game_attempts
  FOR EACH ROW EXECUTE FUNCTION increment_game_user_attempts();
```

---

### 15.3 Sponsorship RPCs

```sql
-- ─── VALIDATE SPONSOR ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_validate_sponsor(p_sponsor_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_profile sponsor_profiles;
BEGIN
  SELECT * INTO v_profile FROM sponsor_profiles WHERE sponsor_id = p_sponsor_id;

  IF NOT FOUND THEN
    RETURN '{"valid":false,"reason":"sponsor_profile_missing"}'::jsonb;
  END IF;
  IF v_profile.brand_safety_status <> 'approved' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'brand_safety_not_approved',
      'brand_safety_status', v_profile.brand_safety_status
    );
  END IF;
  IF v_profile.good_standing_status = false THEN
    RETURN '{"valid":false,"reason":"sponsor_not_in_good_standing"}'::jsonb;
  END IF;
  RETURN '{"valid":true}'::jsonb;
END;
$$;


-- ─── ACTIVATE CAMPAIGN ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_activate_campaign(p_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_campaign   sponsorship_campaigns;
  v_validation jsonb;
BEGIN
  SELECT * INTO v_campaign FROM sponsorship_campaigns WHERE id = p_campaign_id;

  IF NOT FOUND THEN
    RETURN '{"success":false,"reason":"campaign_not_found"}'::jsonb;
  END IF;
  IF v_campaign.status <> 'draft' THEN
    RETURN jsonb_build_object(
      'success', false, 'reason', 'invalid_status', 'current_status', v_campaign.status
    );
  END IF;

  v_validation := rpc_validate_sponsor(v_campaign.sponsor_id);
  IF NOT (v_validation ->> 'valid')::boolean THEN
    RETURN jsonb_build_object('success', false, 'reason', v_validation ->> 'reason');
  END IF;

  UPDATE sponsorship_campaigns
  SET    status = 'active', updated_at = NOW()
  WHERE  id = p_campaign_id;

  RETURN '{"success":true}'::jsonb;
END;
$$;


-- ─── EXPIRE CAMPAIGN (manual; normal expiry via trigger) ──────────────────
CREATE OR REPLACE FUNCTION rpc_expire_campaign(p_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  UPDATE sponsorship_campaigns
  SET    status = 'expired', updated_at = NOW()
  WHERE  id = p_campaign_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN '{"success":false,"reason":"campaign_not_active_or_not_found"}'::jsonb;
  END IF;
  RETURN '{"success":true}'::jsonb;
END;
$$;


-- ─── GET ACTIVE SPONSORSHIPS (public; SECURITY DEFINER) ───────────────────
-- Used by public loaders. Returns active placements + their campaign's creative assets.
CREATE OR REPLACE FUNCTION rpc_get_active_sponsorships(
  p_city_id   uuid,
  p_page_type text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'placement_id',  sp.id,
      'slot_name',     sp.slot_name,
      'page_type',     sp.page_type,
      'page_id',       sp.page_id,
      'campaign_id',   sp.campaign_id,
      'pricing_tier',  sc.pricing_tier,
      'sponsor_name',  s.name,
      'sponsor_logo_url', s.logo_url,
      'assets', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'asset_id',   ca.id,
            'asset_type', ca.asset_type,
            'asset_url',  ca.asset_url,
            'content',    ca.content,
            'metadata',   ca.metadata
          )
        )
        FROM creative_assets ca
        WHERE ca.campaign_id = sc.id
          AND ca.asset_type = CASE sp.slot_name
            WHEN 'story_promo' THEN 'story_promo'
            WHEN 'object_promo' THEN 'object_promo'
            WHEN 'timeline_promo' THEN 'timeline_promo'
            WHEN 'homepage_spotlight_tile' THEN 'homepage_promo'
            ELSE NULL
          END
      )
    )
  )
  INTO v_result
  FROM sponsorship_placements sp
  JOIN sponsorship_campaigns  sc ON sc.id = sp.campaign_id
  JOIN sponsors s ON s.id = sc.sponsor_id
  WHERE sp.city_id   = p_city_id
    AND sp.is_active = true
    AND sc.status    = 'active'
    AND sp.page_type = p_page_type;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


-- ─── GET SPONSOR ASSETS (sponsor-scoped) ──────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_get_sponsor_assets(p_sponsor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'asset_id',    ca.id,
      'campaign_id', ca.campaign_id,
      'asset_type',  ca.asset_type,
      'asset_url',   ca.asset_url,
      'content',     ca.content,
      'metadata',    ca.metadata,
      'created_at',  ca.created_at
    )
  )
  INTO v_result
  FROM creative_assets ca
  WHERE ca.sponsor_id = p_sponsor_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
```
