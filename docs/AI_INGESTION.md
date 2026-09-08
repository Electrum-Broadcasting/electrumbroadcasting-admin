AI_INGESTION_PIPELINE.md
Electrum v1 — Automated Civic Object Ingestion Architecture 
Last updated: 2026 09 08
1. Purpose & Scope
Electrum’s AI Ingestion Pipeline is responsible for automatically discovering, importing, normalizing, enriching, and preparing civic objects for City Admin curation and CEO governance. It is the backbone of Electrum’s scalable civic memory system.
This document defines:
•	ingestion sources
•	ingestion jobs
•	normalization rules
•	enrichment rules
•	suggestion generation
•	media binding
•	admin curation workflow
•	CEO escalation workflow
•	ingestion governance
•	ingestion versioning
The ingestion pipeline is a domain level subsystem separate from:
•	editorial workflow
•	payout workflow
•	sponsor workflow
•	theme/brand workflow
It interacts with these domains only through published civic objects.
2. Pipeline Overview
The ingestion pipeline consists of six sequential stages:
1.	Source Ingestion
2.	Normalization
3.	AI Enrichment
4.	Suggestion Generation
5.	Media Binding (360°)
6.	Admin Curation & CEO Escalation
Each stage is explicit, observable, and auditable through admin_action_logs.
3. Stage 1 — Source Ingestion
3.1 Supported Sources
Electrum v1 supports ingestion from:
•	OpenStreetMap (OSM) — places, amenities, parks, transit
•	Wikidata — people, organizations, landmarks
•	City Open Data Portals — neighborhoods, facilities, events
•	GIS Datasets — boundaries, districts, shapefiles
•	Cultural Heritage Registries — landmarks, artifacts
•	Electrum Internal Sources — curated datasets, manual imports
3.2 raw_ingestion Table
All raw payloads are stored in:
Code
raw_ingestion (
  id uuid PK,
  source_name text,
  source_object_id text,
  payload jsonb,
  ingested_at timestamptz,
  processed boolean
)
3.3 Ingestion Jobs
Ingestion jobs:
•	run on a schedule (Supabase cron or external worker)
•	fetch external data
•	write raw payloads via rpc_ingest_raw
•	never write directly to civic_* tables
3.4 RLS
Only the CEO and ingestion workers (via service role) may access raw_ingestion.
4. Stage 2 — Normalization
Normalization converts raw payloads into structured civic objects.
4.1 Object Type Inference
Based on source + payload:
•	OSM → civic_places
•	Wikidata → civic_entities
•	City GIS → civic_neighborhoods
•	Cultural registries → civic_artifacts
•	Event feeds → civic_events
•	Internal datasets → any civic_* table
4.2 Required Fields
Each civic_* table must receive:
•	city_id
•	name or title
•	slug (auto generated if missing)
•	description (raw or empty)
•	ingestion_source
•	ingestion_metadata
•	status = 'pending'
4.3 Deduplication
Normalization must detect duplicates using:
•	slug similarity
•	name similarity
•	coordinate proximity
•	external IDs
Duplicates are inserted as status = 'pending' and flagged for City Admin review.
4.4 RPC
Normalization workers call:
Code
rpc_normalize_object(raw_id)
to mark ingestion complete.
5. Stage 3 — AI Enrichment
AI enrichment improves civic objects by generating:
•	summaries
•	descriptions
•	tags
•	categories
•	relationships
•	neighborhood suggestions
•	missing metadata
Enrichment does not modify civic_* tables directly. Instead, it writes suggestions into civic_object_suggestions.
6. Stage 4 — Suggestion Generation
6.1 civic_object_suggestions Table
Unified polymorphic table:
Code
civic_object_suggestions (
  id uuid PK,
  object_type text,
  object_id uuid,
  suggestion_type text,
  payload jsonb,
  created_at timestamptz
)
6.2 Suggestion Types
•	summary
•	description
•	tags
•	relationships
•	neighborhood
•	metadata
•	merge_candidate
6.3 RLS
City Admin + CEO may:
•	SELECT
•	INSERT
•	UPDATE
Editors and Contributors may not access suggestions.
6.4 RPC
City Admins accept suggestions via:
Code
rpc_apply_suggestion(suggestion_id)
7. Stage 5 — Media Binding (360°)
7.1 universal-media Bucket
All 360° media is stored under:
Code
universal-media/cities/{city_slug}/objects/{object_slug}/hero360-{timestamp}.jpg
7.2 City Admin Workflow
City Admins upload:
•	hero_360_url
•	thumbnail_360_url
•	inline_360_urls
via Object Manager.
7.3 Missing Media Queue
Objects without 360° media remain:
Code
status = 'pending'
until City Admins upload required assets.
7.4 Future Automation
Electrum v3 may support:
•	AI generated 360°
•	drone capture
•	partner photographer workflows
8. Stage 6 — Admin Curation & CEO Escalation
8.1 City Admin Responsibilities
City Admins:
•	approve objects
•	hide objects
•	edit metadata
•	upload 360° media
•	merge duplicates
•	accept/reject suggestions
•	escalate sensitive objects
8.2 CEO Responsibilities
CEO resolves escalations:
•	naming disputes
•	legal questions
•	sensitive historical content
•	controversial entities
•	cross city conflicts
8.3 Escalation Logging
Escalations are logged in admin_action_logs:
Code
action = 'object_requires_ceo_review'
domain = 'object'
entity_type = 'civic_object'
entity_id = object_id
8.4 Publish Flow
Objects become public when:
Code
status = 'approved'
is_published = true
hero_360_url IS NOT NULL
9. Governance & Safety
9.1 Versioning
The ingestion pipeline is versioned:
•	v1 — basic ingestion + enrichment + curation
•	v2 — relationship inference + neighborhood inference
•	v3 — automated 360° generation
•	v4 — multi city ingestion scaling
•	v5 — ingestion safety rules + rollback
9.2 Safety Rules
•	No ingestion of minors without explicit metadata
•	No ingestion of sensitive entities without CEO review
•	No ingestion of copyrighted media
•	No ingestion of unverifiable claims as facts
•	Potentially harmful or defamatory content requires legal review
9.3 Rollback Strategy
Rollback is handled by:
•	deleting raw_ingestion rows
•	deleting suggestions
•	reverting civic_* rows to status = 'hidden'
•	logging rollback events
10. Lifecycle & Observability
10.1 Logging
All ingestion events are logged via log_admin_action():
•	ingestion_started
•	ingestion_normalized
•	ingestion_enriched
•	ingestion_suggestion_created
•	ingestion_media_bound
•	ingestion_approved
•	ingestion_hidden
10.2 Metrics
Electrum tracks:
•	ingestion throughput
•	normalization success rate
•	enrichment coverage
•	suggestion acceptance rate
•	360° coverage
•	admin curation velocity
10.3 Failure Modes
Common ingestion failures:
•	malformed payload
•	missing city_id
•	missing coordinates
•	duplicate slugs
•	invalid metadata
•	missing 360° media
Failures are logged and surfaced to City Admins.
11. Appendix — RPC Summary
rpc_ingest_raw
Insert raw payloads.
rpc_normalize_object
Mark raw_ingestion row processed.
rpc_apply_suggestion
Apply AI suggestions.
rpc_mark_ingestion_processed
Mark ingestion complete.
12. Appendix — Trigger Summary
generate_slug()
Auto slug generation for civic_* tables.
log_admin_action()
Extended to include ingestion events.
13. Domain Boundary Summary
AI Ingestion Domain includes:
•	raw_ingestion
•	civic_object_suggestions
•	ingestion columns
•	ingestion RPCs
•	ingestion triggers
•	ingestion governance
It does not include:
•	editorial workflow
•	payout workflow
•	sponsor workflow
•	theme/brand workflow
