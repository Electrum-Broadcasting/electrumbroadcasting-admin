# AI_INGESTION_PIPELINE.md
Electrum v1 — Automated Civic Object Ingestion Architecture 
Last updated: 2026 09 08

## Implemented OSM Place MVP

The remainder of this document describes the broader ingestion specification;
it is not evidence that the other sources or object types are implemented.
The governed MVP supports **OpenStreetMap Places only**.

For step-by-step boundary registration and run execution, see the
[Phase 5D-4B Operator Runbook](./PHASE_5D_4B_OPERATOR_RUNBOOK.md).

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

### Boundary preparation for large municipal geometry

Use the **Prepare Boundary** action in Admin → Ingestion → Boundary Registry
when an authoritative Polygon or MultiPolygon exceeds the existing registration
limit. Preparation does not replace or edit the source. It stores the source
geometry, source URL/version, SHA-256, byte size, coordinate count, ring count,
and source-analysis result in an immutable preparation record. Source uploads
are limited to 5 MiB and 50,000 coordinates; these preparation-only limits do
not change the registration validator.

The operator may generate a Douglas–Peucker candidate at 0.1, 0.5, 1, 2, 5, or
10 metres. Coordinates are transformed to a city-centered azimuthal-equidistant
projection before simplification, then transformed back to WGS84. JSTS validates
source and candidate topology; the candidate is also passed through the existing
`parseCityBoundary` registration parser. Candidates must remain at or below
50,000 source coordinates to bound preparation work. Reduced candidates are
retained for comparison even if they still exceed registration limits. Approval
requires at most 5,000 coordinates and 900,000 geometry bytes so the unchanged
registration request remains below its 1 MiB body cap; select a higher
simplification tolerance if a candidate is not yet eligible.

Preparation records the algorithm/version, projection, tolerance, source and
prepared hashes/counts/sizes, signed area delta, and deterministic containment
comparisons. The comparisons use an interior/exterior grid (up to about 4,000
points) and sampled boundary segments with offsets on both sides from 0.5 to 10
metres. A zero-difference grid with boundary-near differences is **not** an
automatic pass: inspect the original/prepared overlay and explicitly acknowledge
those differences before approval. Any interior/exterior grid difference blocks
approval; generate a lower-tolerance candidate. These finite samples do not
prove identical containment for every possible point. Points close to a changed
edge remain uncertain and should be reviewed against the source boundary.

Approval records the operator and audit event. Registration then invokes the
existing `admin_register_osm_boundary` RPC in the same transaction that links
the registered boundary to its preparation record. The original boundary audit
and registration checks remain in force. Preparation emits
`boundary_uploaded`, `boundary_analysis_completed`, `boundary_prepared`,
`boundary_preparation_approved`, and `boundary_registered` audit events, all
linked to the city and preparation; registration also retains the existing
`ingestion_boundary_registered` audit entry on the boundary.

OaklandGIS `City_Limits` sample test: 6,599 source coordinates (242,677 compact
geometry bytes) simplified at 0.1 m to 1,617 coordinates (64,759 bytes), a
75.50% coordinate reduction. The measured area delta was +0.0000323%; the
4,030-point grid had zero differences, while 6 of 3,010 boundary-near probes
differed. The candidate passed the unchanged registration parser, but requires
explicit operator review and acknowledgement of those near-boundary differences
before it can be approved. This sample is a concept/acceptance measurement, not
a claim of exact geographic equivalence or legal-boundary replacement.

Start a run with `POST /api/admin/ingestion/osm/runs` and a JSON body containing
`city_id`, `boundary_id`, `source: "openstreetmap"`, and `query_box` with numeric
`south`, `west`, `north`, and `east`. The box must lie within the registered
boundary's extent. It is a source-query region, **not** the containment rule:
the worker checks each representative point against the registered polygon.
Points outside the polygon, on its boundary, in a hole, or missing coordinates
are quarantined. OSM way/relation centers are representative points, not proof
that a whole feature lies within the city.

### Overpass service configuration

The original governed runner used `https://overpass-api.de/api/interpreter`,
HTTP POST, `Content-Type: application/x-www-form-urlencoded`, and a `data`
field containing the Overpass QL query. It did not explicitly set User-Agent,
Referer, or Accept; the Node fetch implementation supplied its defaults
(observed as `undici` and `*/*` for User-Agent and Accept). The query requested
`[out:json][timeout:60]` and `out center tags 51 qt`; the fetch timeout was
35 seconds. The repository did not specify a platform execution limit.
Those are source and local-observation values; the deployed platform's actual
execution limit has not been verified.

The runner now uses the server-only `OVERPASS_ENDPOINT` setting, defaulting to
`https://overpass-api.de/api/interpreter`. Configure one approved HTTPS
interpreter URL, without embedded username, password, or fragment. URL query
parameters may contain credentials, so keep configuration and logs private.
An invalid setting is rejected before a batch is started. Requests do not
automatically follow redirects or switch providers; configure the final URL.
Providers requiring authentication headers need separate integration work.

The outbound request inspected in the route test is:

```text
POST <configured HTTPS interpreter URL>
Content-Type: application/x-www-form-urlencoded
User-Agent: Electrum Ingestion/1.0 (+https://electrumbroadcasting.com)
Referer: not explicitly set
Accept: not explicitly set (Node fetch normally sends */*)
Body: data=<URL-encoded Overpass QL>
```

For the test box `(south, west, north, east) = (0, 0, 10, 10)`, the decoded
`data` field contains exactly:

```text
[out:json][timeout:60];
(
  nwr["amenity"~"^(arts_centre|library|marketplace|place_of_worship|school|theatre)$"](0,0,10,10);
  nwr["historic"~"^(archaeological_site|building|castle|memorial|monument|ruins)$"](0,0,10,10);
  nwr["leisure"~"^(garden|park|sports_centre)$"](0,0,10,10);
  nwr["public_transport"~"^(station|stop_position|platform)$"](0,0,10,10);
  nwr["tourism"~"^(attraction|gallery|museum|viewpoint)$"](0,0,10,10);
);
out center tags 51 qt;
```

Actual requests substitute the selected query box. The HTTP timeout is 80 seconds,
allowing time for the 60-second query and provider queueing. The route declares
`maxDuration = 180` seconds for platforms that support it. Verify the deployed
host, proxy, and plan permit at least 180 seconds for the entire synchronous
run, including item processing and auditing. This setting is not a guarantee:
interruptions or a shorter effective platform limit can still strand a batch.

Provider HTTP errors and transport failures are recorded in the existing batch
failure audit. The UI can distinguish rejection, rate limiting, malformed
requests, timeouts, capacity/unavailability, and unknown responses. No automatic
retry occurs. On HTTP 429, wait at least the displayed delay and comply with the
provider's policy. For HTTP 406, stop and check provider policy; do not switch
providers to evade a block. Check batch history before any retry.

The [public Overpass instance guidance](https://wiki.openstreetmap.org/wiki/Overpass_API)
requires identifiable applications and recommends paid or self-hosted services
for commercial use. Public instances are shared and have no reliability
guarantee; review each instance's current terms and limits. For production,
evaluate a paid Overpass-compatible provider such as Geofabrik against its terms,
authentication, data freshness, and service commitments. Self-hosting requires
provisioning storage and compute, initial data loading, replication updates,
monitoring, and backup and security operations. Select and verify an approved
provider before changing the server configuration; do not implement automatic
failover around provider access restrictions.

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
