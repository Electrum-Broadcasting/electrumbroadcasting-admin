**DATA-MODEL.md 
Electrum’s data model is a city centric relational schema built on Supabase/PostgreSQL with strict Row Level Security (RLS). This document describes all core tables, relationships, foreign keys, and usage patterns.
It is designed for both human contributors and AI agents (Copilot, Workspace) to understand the database structure and enforce consistent, RLS safe access patterns.
1. Core Concepts
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
2. Table Overview
Electrum’s schema is composed of the following major tables:
City Tables
•	cities
•	city_brand_settings
•	city_design_system
•	city_feature_toggles
•	city_navigation — active but lightly used
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
Sponsor Tables
•	ad_clicks 
•	ad_creatives 
•	ad_impressions 
•	ad_slots 
•	sponsors
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
•	city_budget (new)
•	sponsor_allocations (new)
•	production_units (new)
•	payout_batches (new)
•	payout_batch_items (new)
AI Response Tables
•	ai_response_cache 
•	ai_usage_logs
Gaming Tables
•	game_answers
•	game_attempts
•	game_question_options
•	game_scores
•	games
3. Core Table Schema Blocks
Table: cities
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
•	1 → 1 with city_brand_settings
•	1 → 1 with city_design_system
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
Table: city_brand_settings
Defines per city branding, colors, logos, and identity.
column_name	data_type
id	uuid
city_id	uuid
homepage_tagline	text
homepage_subtitle	text
created_at	timestamp with time zone
updated_at	timestamp with time zone
hero_title	text
hero_subtitle	text
hero_cta_text	text
hero_cta_link	text
social_youtube	text
social_facebook	text
social_instagram	text
social_bluesky	text
slideshow_asset_ids	ARRAY
accessibility	jsonb
child_safety	jsonb
logo	jsonb
description	text
summary	text
pages	Jsonb
Status	text

Table: city_design_system
Defines per city design tokens used by the UI.
column_name	data_type
id	uuid
draft_theme	jsonb
updated_at	timestamp with time zone
published_theme	jsonb
city_id	Uuid
Status	text
-- Public UI consumes only:
•	colors.accent, colors.background, colors.foreground, colors.buttonText
•	typography.heading, typography.body
Table: civic_entities
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

Table: civic_events
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
thumbnail_360_url	text

Table: civic_places
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
slug	text

Table: civic_moments
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
body	text
Table: civic_stories
column_name	data_type
id	uuid
title	text
body	text
summary	text
author_name	text
published_at	timestamp with time zone
city_id	uuid
created_at	timestamp with time zone
updated_at	timestamp with time zone
slug	text
category	text
city	text
year	integer
tags	ARRAY
image_description	text
related_place_ids	ARRAY
related_entity_ids	ARRAY
related_moment_ids	ARRAY
date_range	text
neighborhood	text
cross_city_links	ARRAY
entities	ARRAY
is_published	boolean
is_frozen	boolean
contributor_id	uuid
review_status	text
review_notes	text
editor_id	uuid
reviewed_at	timestamp with time zone
revision_requested	boolean
revision_notes	text
revision_submitted_at	timestamp with time zone
flag_reason	text
hero_360_url	text
thumbnail_360_url	text
neighborhood_360_url	text
inline_360_urls	ARRAY
sponsor_360_url	text
sponsor_flat_url	text
sponsor_name	text
sponsor_link	text
sponsor_alt_text	text
hero_image_url	text
related_event_ids	ARRAY

Table: civic_neighborhoods

column_name	data_type
id	uuid
city_id	uuid
name	text
slug	text
description	text
created_at	timestamp with time zone
updated_at	timestamp with time zone
is_published	boolean


Table: civic_artifacts

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
Table: games
Defines games for the public interface.

column_name	data_type
id	uuid
game_type	text
city_name	text
game_data	jsonb
difficulty	text
created_at	timestamp with time zone
updated_at	timestamp with time zone
published	boolean
published_at	timestamp with time zone
visibility	text
owner_id	uuid
Table: ad_slots
Defines sponsor ad placements.
column_name	data_type
id	uuid
name	text
position	text
width	integer
height	integer
description	text
created_at	timestamp with time zone
Table: sponsors
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
Table: sponsor_allocations
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
Table: production_units
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
unit_type	text	NULLABLE	e.g., 'article' | 'video' | 'event' | 'series'.
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
status
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
•	Contributors may SELECT their own units.
•	Editors may SELECT units they reviewed.
•	City Admins may SELECT units for their cities.
•	Only City Admins may transition units to city_published.
•	CEO may update all fields.
Table: payout_batches
A grouped set of payout items submitted for payment processing in one operation. Tied to a city_budget period. Created automatically at the end of each payout period.
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
A payout_batch may only be created against a city_budget with status = 'active' (enforce via RPC). city_admin can INSERT (status='pending') and SELECT for their city. Only super_admin can transition status to 'paid' or 'failed'. Status transitions must be enforced via RPC, not direct UPDATE.
Table: city_budget
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
Table: payout_batch_items
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
Table: admin_users
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

Table: roles
Defines platform level permission roles for authenticated users.
column_name	data_type
id	uuid
name	text
description	text
created_at	timestamp with time zone
-- Publish permission has been revoked on civic_stories
-- Create, read, and update has been granted on civic_stories drafts
-- Publish 


Table: user_roles
Join table linking authenticated users to roles.
column_name	data_type
id	uuid
user_id	uuid
created_at	timestamp with time zone
role_id	Uuid

Table: admin_action_logs
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

4. Join Tables
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
5. Naming Conventions
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
Tables begin with the ad_ prefix.
•	ad_slots
•	ad_creatives
•	ad_impressions
•	ad_clicks
Gaming Domain
Tables begin with the game_ prefix.
•	game_question_options
•	game_answers
•	game_attempts
•	game_scores
Admin Domain
Tables use descriptive names without prefixes.
•	admin_users
•	roles
•	user_roles
•	audit_logs
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
•	Sponsor tables: ad_*
•	Gaming tables: game_*
•	Admin tables: descriptive names
•	Slugs: slug
•	Timestamps: created_at, updated_at

6. Foreign Key Map
6.1 City Domain Foreign Keys
Cities
•	cities.id → all civic tables
•	cities.id → city_brand_settings.city_id
•	cities.id → city_design_system.city_id
•	cities.id → city_feature_toggles.city_id
•	cities.id → city_navigation.city_id
•	cities.id → city_prompts.city_id
•	cities.id → city_safety_settings.city_id
•	cities.id → city_freeze_events.city_id
6.2 Civic Content Foreign Keys
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
6.3 Relationship Table Foreign Keys
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
6.4 Sponsor Domain Foreign Keys
•	ad_creatives.slot_id → ad_slots.id
•	ad_creatives.sponsor_id → sponsors.id
•	ad_impressions.creative_id → ad_creatives.id
•	ad_clicks.creative_id → ad_creatives.id
6.5 Gaming Domain Foreign Keys
•	game_question_options.game_id → games.id
•	game_answers.question_id → game_question_options.id
•	game_attempts.game_id → games.id
•	game_scores.attempt_id → game_attempts.id
6.6 Admin Domain Foreign Keys
•	admin_users.role_id → roles.id
•	user_roles.user_id → admin_users.id
•	user_roles.role_id → roles.id
•	payout_batch_items.civic_story_id → civic_stories.id
•	payout_batch_items.production_unit_id → production_units.id
•	payout_batch_items.payee_id → admin_users.id
•	civic_stories.author_name → admin_users.id
•	sponsor_allocations.created_by → admin_users.id

7. RLS Model
Electrum uses a strict Role Level Security (RLS) model to protect administrative data, ensure public safe access to civic content, and enforce domain boundaries. All public queries run under the anon role. All admin operations run under authenticated roles or the Supabase service role.
7.1 Public UI (anon role)
The anon role powers all public pages. It must be able to read city configuration and civic content, but must not access administrative or sensitive tables.
Anon CAN SELECT:
•	City tables
o	cities
o	city_brand_settings
o	city_design_system
o	city_feature_toggles
o	city_navigation
o	city_prompts
o	city_safety_settings
o	city_freeze_events
•	Civic content tables
o	civic_entities
o	civic_events
o	civic_places
o	civic_stories
o	civic_moments
o	civic_eras
o	civic_neighborhoods
o	civic_artifacts
•	Relationship tables
o	civic_relationships
o	event_eras
o	moment_entities
o	moment_places
o	moment_eras
o	moment_stories
o	moment_neighborhoods
•	Sponsor tables (limited)
o	anon CAN SELECT:
	ad_creatives
o	anon CANNOT SELECT:
	sponsors
	ad_slots
	ad_impressions
	ad_clicks
•	Gaming tables (limited)
o	anon CAN SELECT:
	games
	game_question_options
	game_answers
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
7.2 Admin UI (authenticated admin users)
Authenticated admin users operate under the authenticated role and have full CRUD access to all admin level tables.
Admin CAN:
•	SELECT / INSERT / UPDATE / DELETE
o	Admin tables
o	Sponsor tables
o	Gaming attempt tables
o	Civic content tables
o	City configuration tables
Admins bypass public restrictions but still operate under RLS policies that grant elevated access.
7.3 Contributors (limited authenticated role)
Contributors are authenticated users with restricted write access.
Contributors CAN:
•	SELECT all civic content
•	INSERT/UPDATE civic content (depending on your policy)
•	CANNOT access admin tables
•	CANNOT access fraud or audit tables
•	CANNOT modify global settings
•	CANNOT modify sponsor or gaming tables
This role is designed for editorial workflows.
7.4 Service Role (Supabase backend)
The service role bypasses RLS entirely.
It is used for:
•	Admin UI server actions
•	Internal Supabase functions
•	Scheduled jobs
•	Secure backend operations
The service role is never exposed to the public UI.
7.5 Production Units
7.5.a RLS: Production Units (production_units)
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
7.5.b RLS: Payout Batches (payout_batches)
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
7.5.c RLS: Payout Batch Items (payout_batch_items)
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
7.5.d RLS: City Budget (city_budget)
Purpose
Prevent overspend and ensure City Admins can see their budget.
Policies
City Admins
•	CAN: SELECT
•	CANNOT: UPDATE
CEO
•	Full access
7.5.e RLS: Publication Gate (civic_stories)
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
7.6 RLS Summary
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
8. Query Model
Electrum’s query model is divided into Public Queries (anon role) and Admin Queries (authenticated or service role). Public queries must respect RLS and use the platform’s canonical loader functions. Admin queries may bypass RLS via the service role.
8.1 Public Queries (anon role)
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
Sponsor Slot
Loads sponsor creatives for rotation.
•	ad_slots
•	ad_creatives
Games
Loads trivia content.
•	games
•	game_question_options
•	game_answers
8.2 Public Loader Functions
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
8.3 Admin Queries (authenticated or service role)
Admin queries may bypass RLS and access sensitive tables. These queries are used by the admin dashboard, fraud detection, and global configuration systems.
Admin Queries Include:
•	fraud_rules
•	fraud_signals
•	fraud_contributor_state
•	audit_logs
•	security_audit_logs
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
9. Storage Model (Unified)
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
Legacy buckets (story-360, story-images, ad-banners, etc.) remain but are deprecated.
All new uploads must use universal-media.
10. Security Logging Model
Core tables: security_audit_logs, audit_logs.
Electrum uses a centralized, immutable security logging system to record all administrative actions across the platform. This ensures accountability, auditability, and compliance for all city level and global configuration changes.
Security logging is handled exclusively through:
•	security_audit_logs — canonical, immutable audit table
•	audit_logs — legacy or secondary audit table (optional)
These tables record who performed an action, what was changed, which table was affected, and when the action occurred.
Security logging is not implemented by scattering timestamps or metadata across every admin restricted table. Instead, all logs are written to security_audit_logs using a consistent schema.
10.1 Canonical Audit Tables: 
Table: security_audit_logs
Purpose: security critical events (auth and role changes).
Every admin restricted mutation (INSERT, UPDATE, DELETE) must generate a log entry in this table.
Schema Columns
column_name	data_type
id	uuid
user_id	uuid
action	text
target_user_id	uuid
old_role	text
new_role	text
ip_address	inet
user_agent	text
created_at	timestamp with time zone

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
10.2 What Gets Logged

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
•	Sponsor system
o	sponsors
o	ad_slots
o	ad_creatives
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
10.3 What Does Not Get Logged
Some tables should not generate audit entries:
•	security_audit_logs (self referential logging is forbidden)
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
10.4 Table Level Metadata Requirements
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
10.5 How Logs Are Generated
Admin UI
All admin UI mutations must:
1.	Perform the database mutation using the service role
2.	Write a corresponding entry into security_audit_logs
3.	Include a structured diff in metadata
Supabase Functions / Triggers (optional)
For high risk tables (global settings, fraud rules), triggers may also write logs automatically.
Workspace Enforcement
Workspace must:
•	ensure all admin routes write audit entries
•	ensure no admin mutation bypasses logging
•	ensure metadata is structured and consistent
•	ensure logs are immutable (no UPDATE/DELETE allowed)
10.6 RLS for logging tables
•	anon: CANNOT SELECT security_audit_log or audit_logs.
•	authenticated admin / service role: CAN SELECT and INSERT into both tables.
•	contributors: CANNOT SELECT logs; mutations they trigger (e.g., story submissions) still generate audit_logs entries with actor_user_id set.
10.7 Summary
Electrum’s security logging model is:
•	centralized
•	immutable
•	complete
•	consistent
•	Workspace enforced
•	launch critical
Every admin action is logged. Every log is structured. Every log is immutable. Every log is stored in security_audit_logs.
11. Draft/Publish Model 
Electrum uses two rows per city in city_brand_settings + city_design_system tables:
city_brand_settings:
  city_id: <uuid>
  status: "draft"
  ...
city_brand_settings:
  city_id: <uuid>
  status: "published"
  ...

city_design_system:
  city_id: <uuid>
  status: "draft"
  ...
city_design_system:
  city_id: <uuid>
  status: "published"
  ...

11.1 Publish Action
Publishing copies draft → published:
INSERT INTO city_brand_settings (city_id, status, ...)
SELECT city_id, 'published', ...
FROM city_brand_settings
WHERE city_id = $1 AND status = 'draft';
Same for design system.
Preview mode loads draft. Public UI loads published.
11.2 Preview Architecture
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
11.3 Public UI Loaders 
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
12. Workspace Responsibilities
Workspace is responsible for enforcing Electrum’s architectural rules, normalizing data access, and refactoring code to match the platform’s canonical data model. Workspace must operate within the schema and RLS boundaries defined in this document.
Workspace responsibilities fall into three categories: Normalize, Verify, and Refactor.
12.1 Normalize
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
12.2 Verify
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
12.3 Refactor
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
12.4 Workspace SHOULD
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
12.5 Workspace MUST NOT
Workspace MUST NOT:
•	Create new tables
•	Modify your schema
•	Modify RLS policies
•	Generate new modules
•	Create new admin systems
•	Create new civic domains
•	Create new sponsor or game types
•	Rewrite your data model
Workspace must operate within the schema and architectural boundaries defined in this document.

**
