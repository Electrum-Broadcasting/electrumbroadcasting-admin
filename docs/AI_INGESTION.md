# AI_INGESTION_PIPELINE.md
Electrum v1 — Automated Civic Object Ingestion Architecture 
Last updated: 2026 09 08

## Implemented OSM Place MVP

The remainder of this document describes the broader ingestion specification;
it is not evidence that the other sources or object types are implemented.
The governed MVP supports **OpenStreetMap Places only**.

An authenticated, active City Admin assigned to the city, CEO, or Platform
Admin registers a sourced and versioned GeoJSON Polygon or MultiPolygon through
`POST /api/admin/ingestion/osm/boundaries`. The JSON body contains `city_id`,
`source_url`, `source_version`, and `geometry`. The administrator is responsible
for selecting an authoritative source. Registration validates geometry in the
trusted server, records the actor and an audit entry, and returns `boundary_id`.
Boundary versions are immutable. Registration currently accepts at most 5,000
coordinates and rejects antimeridian-crossing rings; use a suitable verified
boundary rather than bypassing validation. If the registration response is lost,
an operator must reconcile it against the boundary-registration audit before
retrying.

Start a run with `POST /api/admin/ingestion/osm/runs` and a JSON body containing
`city_id`, `boundary_id`, `source: "openstreetmap"`, and `query_box` with numeric
`south`, `west`, `north`, and `east`. The box must lie within the registered
boundary's extent. It is a source-query region, **not** the containment rule:
the worker checks each representative point against the registered polygon.
Points outside the polygon, on its boundary, in a hole, or missing coordinates
are quarantined. OSM way/relation centers are representative points, not proof
that a whole feature lies within the city.

Each run is limited to 50 source results. A larger response fails without
processing a subset; split the query region and retry. Overpass's
`timestamp_osm_base` is recorded as the source version. An incomplete Overpass
response, a missing source version, or a request failure fails the batch.
`GET /api/admin/ingestion/osm/runs?batch_id=<uuid>` returns city-scoped batch
and item dispositions without exposing raw payloads. To reconcile a stranded
running batch, an authorized administrator can `PATCH` the same endpoint with
`batch_id`, `operation: "abort"`, and a nonblank `reason`; staged items become
audited failures. A start or finish with an unconfirmed outcome returns the
preassigned batch ID for lookup. Retry with a new batch after checking the
prior results. A lost HTTP response may require an operator to locate the
batch in the ingestion audit. The worker runs synchronously and a request
timeout or process interruption can leave a batch running; abort it before
retrying.

Raw items, their hashes, batch, boundary, source version, actor, and
dispositions are persisted. Creation uses the existing guarded Place RPC and
writes provenance and ingestion audit in the same transaction. Source identity
is `(openstreetmap, external_id)`, including the OSM node/way/relation type.
Existing identities are recorded as duplicates; ambiguous existing Places are
quarantined. Imported Places are `pending` and unpublished; no relationships or
panoramas are imported.

The legacy `ingest_osm_places` and `normalize_osm_places` Edge Function
endpoints are retired. Deploy both retired endpoints together with the new
server and migrations before enabling runs; otherwise an old deployment can
still use the previous direct-write path. Existing legacy raw rows are not
automatically processed. The worker trusts the registered boundary and must be
the only ingestion caller of the service-only creation RPCs.

For Seattle validation, first register a verified Seattle boundary and record
its source, version and rights. Have an assigned City Admin use small
non-overlapping query regions to target 25–50 pending Places. Check batch/item
and Place audit IDs, inspect duplicates and quarantines, and verify city-scoped
review and the existing approve/hide/restore workflow before scaling. Where
the city requires a published panorama, attach and publish it **before**
approving the Place; otherwise it may be attached afterward. Verify the approved
Place as a same-city hotspot target. No live ingestion is required to deploy
or run the isolated tests.

OpenStreetMap data is available under the ODbL. Before publication, confirm
source and boundary licensing and ensure the consuming application provides
the required [OpenStreetMap attribution](https://www.openstreetmap.org/copyright).

## 1. Purpose & Scope
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

## 2. Pipeline Overview
The ingestion pipeline consists of six sequential stages:
1.	Source Ingestion
2.	Normalization
3.	AI Enrichment
4.	Suggestion Generation
5.	Media Binding (360°)
6.	Admin Curation & CEO Escalation
Each stage is explicit, observable, and auditable through admin_action_logs.

## 3. Stage 1 — Source Ingestion
### 3.1 Supported Sources
The broader specification envisages ingestion from:
•	OpenStreetMap (OSM) — places, amenities, parks, transit
•	Wikidata — people, organizations, landmarks
•	City Open Data Portals — neighborhoods, facilities, events
•	GIS Datasets — boundaries, districts, shapefiles
•	Cultural Heritage Registries — landmarks, artifacts
•	Electrum Internal Sources — curated datasets, manual imports

### 3.2 raw_ingestion Table
The legacy raw staging table is:

raw_ingestion (
  id uuid PK,
  source_name text,
  source_object_id text,
  payload jsonb,
  ingested_at timestamptz,
  processed boolean
)

### 3.3 Ingestion Jobs
The broader design envisages ingestion jobs that:
•	run on a schedule (Supabase cron or external worker)
•	fetch external data
•	write raw payloads via rpc_ingest_raw
•	never write directly to civic_* tables

### 3.4 RLS
Only the CEO and ingestion workers (via service role) may access raw_ingestion.

## 4. Stage 2 — Normalization
Normalization converts raw payloads into structured civic objects.

### 4.1 Object Type Inference
Based on source + payload:
•	OSM → civic_places
•	Wikidata → civic_entities
•	City GIS → civic_neighborhoods
•	Cultural registries → civic_artifacts
•	Event feeds → civic_events
•	Internal datasets → any civic_* table

### 4.2 Required Fields
Each civic_* table must receive:
•	city_id
•	name or title
•	slug (auto generated if missing)
•	description (raw or empty)
•	ingestion_source
•	ingestion_metadata
•	status = 'pending'

### 4.3 Deduplication
Normalization must detect duplicates using:
•	slug similarity
•	name similarity
•	coordinate proximity
•	external IDs
The implemented OSM path records exact/existing identities as duplicates and
quarantines potential duplicates rather than inserting another Place.

### 4.4 RPC
The broader design envisages normalization workers calling:

rpc_normalize_object(raw_id)
to mark ingestion complete.

## 5. Stage 3 — AI Enrichment
AI enrichment improves civic objects by generating:
•	summaries
•	descriptions
•	tags
•	categories
•	relationships
•	neighborhood suggestions
•	missing metadata
Enrichment does not modify civic_* tables directly. Instead, it writes suggestions into civic_object_suggestions.

## 6. Stage 4 — Suggestion Generation

### 6.1 civic_object_suggestions Table
Unified polymorphic table:

civic_object_suggestions (
  id uuid PK,
  object_type text,
  object_id uuid,
  suggestion_type text,
  payload jsonb,
  created_at timestamptz
)

### 6.2 Suggestion Types
•	summary
•	description
•	tags
•	relationships
•	neighborhood
•	metadata
•	merge_candidate

### 6.3 RLS
City Admin + CEO may:
•	SELECT
•	INSERT
•	UPDATE
Editors and Contributors may not access suggestions.

### 6.4 RPC
City Admins accept suggestions via:

rpc_apply_suggestion(suggestion_id)

## 7. Stage 5 — Media Binding (360°)
### 7.1 universal-media Bucket
All 360° media is stored under the canonical city panorama path:

universal-media/cities/{cityId}/panoramas/

### 7.2 City Admin Workflow
City Admins upload the 360° source file to universal-media and create a
`panoramas` row for the civic parent. The row's `civic_object_type` identifies
the parent, including `civic_story` where applicable. The platform registers
the stored asset in `media_assets`.

`hero_360_url` is generated from the primary published panorama and is not an
upload field. Panorama preview imagery uses `panoramas.thumbnail_url`.
`inline_360_urls` is a legacy compatibility field slated for future
deprecation; do not write new uploads to it.

### 7.3 Missing Media Queue
When a city's published-panorama requirement is enabled, a Place cannot be
approved until a published panorama is attached. Otherwise, a pending Place
may be approved without one.

### 7.4 Future Automation
Electrum v3 may support:
•	AI generated 360°
•	drone capture
•	partner photographer workflows

## 8. Stage 6 — Admin Curation & CEO Escalation

### 8.1 City Admin Responsibilities
City Admins:
•	approve objects
•	hide objects
•	edit metadata
•	upload 360° media
•	merge duplicates
•	accept/reject suggestions
•	escalate sensitive objects

### 8.2 CEO Responsibilities
CEO resolves escalations:
•	naming disputes
•	legal questions
•	sensitive historical content
•	controversial entities
•	cross city conflicts

### 8.3 Escalation Logging
Escalations are logged in admin_action_logs:

action = 'object_requires_ceo_review'
domain = 'object'
entity_type = 'civic_object'
entity_id = object_id

### 8.4 Publish Flow
Objects become public when:

status = 'approved'
is_published = true
and, where immersive media is required, a primary published panoramas row exists.
hero_360_url is generated from that row and is not the eligibility source.

For `civic_places`, approval is restricted to the guarded transition
`pending / false` → `approved / true`, subject to any enabled city panorama
requirement. Legacy `pending / true` Places are preserved and are not
automatically reprocessed.

## 9. Governance & Safety
### 9.1 Versioning
The ingestion pipeline is versioned:
•	v1 — basic ingestion + enrichment + curation
•	v2 — relationship inference + neighborhood inference
•	v3 — automated 360° generation
•	v4 — multi city ingestion scaling
•	v5 — ingestion safety rules + rollback

### 9.2 Safety Rules
•	No ingestion of minors without explicit metadata
•	No ingestion of sensitive entities without CEO review
•	No ingestion of copyrighted media
•	No ingestion of unverifiable claims as facts
•	Potentially harmful or defamatory content requires legal review

### 9.3 Rollback Strategy
Rollback is handled by:
•	deleting raw_ingestion rows
•	deleting suggestions
•	reverting civic_* rows to status = 'hidden'
•	logging rollback events

## 10. Lifecycle & Observability

### 10.1 Logging
All ingestion events are logged via log_admin_action():
•	ingestion_started
•	ingestion_normalized
•	ingestion_enriched
•	ingestion_suggestion_created
•	ingestion_media_bound
•	ingestion_approved
•	ingestion_hidden

### 10.2 Metrics
Electrum tracks:
•	ingestion throughput
•	normalization success rate
•	enrichment coverage
•	suggestion acceptance rate
•	360° coverage
•	admin curation velocity

### 10.3 Failure Modes
Common ingestion failures:
•	malformed payload
•	missing city_id
•	missing coordinates
•	duplicate slugs
•	invalid metadata
•	missing 360° media
Failures are logged and surfaced to City Admins.

## 11. Appendix — RPC Summary
rpc_ingest_raw
Insert raw payloads.
rpc_normalize_object
Mark raw_ingestion row processed.
rpc_apply_suggestion
Apply AI suggestions.
rpc_mark_ingestion_processed
Mark ingestion complete.

## 12. Appendix — Trigger Summary
generate_slug()
Auto slug generation for civic_* tables.
log_admin_action()
Extended to include ingestion events.

## 13. Domain Boundary Summary
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
