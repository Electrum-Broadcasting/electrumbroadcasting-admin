# Phase 5D-4B — Governed Place Import Acceptance Report

## Report status

**Acceptance status:** Not run  
**Live ingestion executed:** No  
**Environment:** Not selected  
**Report owner:**  
**Execution date:**  

This is an evidence-capture template, not a record of a successful acceptance
run. Do not mark a check passed without recording the evidence and identifiers
needed to reproduce or audit it.

## Scope and guardrails

- City: Seattle
- Source: OpenStreetMap Places only
- Target: one controlled batch of 10–20 candidate Places
- Explicitly excluded: neighborhoods, entities, artifacts, events, stories,
  and moments
- No direct writes to civic Place records; use the governed admin workflow.
- Do not retry an uncertain registration or batch start until its audit/batch
  record has been reconciled.
- No imported Place may be approved, published, or public immediately after
  ingestion.

The worker supports at most 50 source results per run. Keep the query region
small enough to return the planned sample; the query box must fit within the
registered boundary extent, while each candidate is checked against the
boundary polygon.

## Execution record

| Item | Recorded value |
| --- | --- |
| Environment / Supabase project | |
| Application deployment / commit | |
| Ingestion and retired-function deployment verified | |
| Seattle city ID | |
| Assigned Seattle City Admin | |
| Other-city City Admin used for isolation check | |
| Boundary source URL and attribution/rights confirmation | |
| Boundary source version | |
| Boundary ID | |
| Boundary registration audit ID | |
| Boundary geometry format | |
| Query box / sample selection method | |
| Batch ID | |
| Batch start and finish audit IDs | |
| OSM snapshot/source version | |
| Candidate count / created / duplicate / quarantined / failed | |
| Acceptance operator and date | |

Confirm source licensing and required OpenStreetMap attribution before public
publication. Record the evidence or approval reference here:

** Seattle Open Data Terms of Use **

https://data.seattle.gov/stories/s/Data-Policy/6ukr-wvup/


By using data made available through this site the user agrees to all the conditions stated in the following paragraphs.
To the extent the data consists of a list of individuals or can be readily sorted, filtered, or configured as a list of individuals, it is not to be used for a commercial purpose.
The City of Seattle makes no claims as to the completeness, accuracy, timeliness, or content of any data contained in this application; makes no representation of any kind, including, but not limited to, warranty of the accuracy or fitness for a particular use; nor are any such warranties to be implied or inferred with respect to the information or data furnished herein. The data contained in the site is used at one's own risk.
Unless otherwise indicated, data on this site does not require specific attribution.
Right to Modify or Discontinue Datasets
The data is subject to change as modifications and updates are completed. 
The City of Seattle reserves the right to discontinue providing any or all datasets and associated data products, visualizations, etc. at any time without prior notice.
Privacy
To ensure open datasets adhere to Seattle’s privacy policy  and principles, all new open datasets are reviewed by the City’s Privacy Team prior to publication on data.seattle.gov. If you have concerns about a dataset being in violation of the City’s privacy policy, please let us know by sending an email to open.data@seattle.gov.
For more information, please refer to the City's open data policy:
http://www.seattle.gov/Documents/Departments/SeattleGovPortals/CityServices/OpenDataPolicyV1.pdf


**Licensing / attribution evidence:**
The City of Seattle makes no representation or warranty as to its accuracy, and in particular, its accuracy as to labeling, dimensions, contours, property boundaries, or placement or location or any map feature thereof.

** Dataset metadata:
 
https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::seattle-city-limits-2/about

Details
Dataset
Feature Layer

October 4, 2026 at 3:02:27 PM PDT
Info Updated

September 29, 2026 at 5:25:14 PM PDT
Data Updated

September 15, 2022 at 8:37:18 AM PDT
Published Date

Records: 5

Public
Anyone can see this content

Custom License
See above

## Part A — Boundary registry acceptance

| Check | Result (Pass / Fail / Not run) | Evidence / ID / notes |
| --- | --- | --- |
| Seattle boundary registered through the governed endpoint | Not run | |
| Source attribution and source version recorded | Not run | |
| Registering administrator and audit record confirmed | Not run | |
| Valid coordinate inside Seattle accepted | Not run | |
| Clearly outside coordinate rejected by validation | Not run | |
| Invalid geometry rejected | Not run | |
| Unsupported geometry type rejected | Not run | |

**Boundary test inputs and outcomes:**

## Part B — Controlled ingestion batch

| Check | Result (Pass / Fail / Not run) | Evidence / ID / notes |
| --- | --- | --- |
| Batch is associated with Seattle and the registered boundary | Not run | |
| Source is `openstreetmap`; snapshot/version recorded | Not run | |
| Batch start and finish audits found | Not run | |
| Small sample processed without exceeding the 50-result limit | Not run | |
| Final counts reconcile with item dispositions | Not run | |

**Batch outcome and count reconciliation:**

## Part C — Pending Place creation

Select representative records and verify every created Place, not just the
sample, remains pending and unpublished.

| Place ID | OSM external ID | City ID | Status | Published? | Provenance visible? | Review visible? | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

**Pass condition:** Every newly created Place is Seattle-scoped,
`pending`, `is_published = false`, provenance-linked, and visible in review.
No imported Place is approved, published, or public immediately after
ingestion.

## Part D — Audit and provenance

For each sampled record, trace both directions:

`Place → batch → raw OSM item/payload`

`raw OSM item/payload → batch → Place (if created)`

| Place ID | Batch ID | Raw item ID | External ID | Source hash | Creation/disposition audit ID | Trace verified? |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Verify source identifier, external ID, batch ID, raw item, source version, and
creation audit. Confirm non-created outcomes also have a recorded disposition
and audit.

## Part E — Idempotency

Replay the same source records through a new governed batch. Do not count
retries within the same raw item as proof of cross-batch idempotency.

| External ID | Original Place ID (if created) | Replay batch/item ID | Replay disposition | New Place created? | Audit ID |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

**Pass condition:** No duplicate Place is created; each existing source
identity is recognized, its duplicate disposition is recorded, and its audit
trail is traceable.

## Part F — City-scoped review acceptance

| Check | Result (Pass / Fail / Not run) | Evidence / notes |
| --- | --- | --- |
| Assigned Seattle City Admin sees imported Places in review | Not run | |
| Place can be opened and provenance inspected | Not run | |
| Admin assigned to another city cannot see/open Seattle review items | Not run | |

## Part G — Place lifecycle acceptance

Record lifecycle audits and observed state after each transition. Approval is
restricted to an assigned City Admin.

| Transition | Result (Pass / Fail / Not run) | Observed state | Audit ID |
| --- | --- | --- | --- |
| Initial state: pending / unpublished | Not run | | |
| Approve: published | Not run | | |
| Hide: hidden / unpublished | Not run | | |
| Restore: pending / unpublished | Not run | | |

## Part H — Panorama compatibility

Before testing, record whether Seattle requires a published panorama for Place
approval:

**Published-panorama requirement enabled?**  
**How was this verified?**

If enabled, a published panorama is a prerequisite to approval. Attach and
publish it before the first approval. Otherwise, attach and publish after
approval. The restored Place returns to pending; if a published Place is
needed for the subsequent hotspot check, approve it again after restore and
record that additional lifecycle audit.

| Check | Result (Pass / Fail / Not run) | Evidence / ID / notes |
| --- | --- | --- |
| Panorama Manager available for the imported Place at the applicable lifecycle state | Not run | |
| Panorama upload/attachment succeeds | Not run | |
| Panorama publication succeeds | Not run | |
| Upload, attachment, and publication audits found | Not run | |

**Panorama ID / media asset ID / audit IDs:**

## Part I — Hotspot eligibility

Use the imported Place in the existing same-city hotspot workflow.

| Check | Result (Pass / Fail / Not run) | Evidence / ID / notes |
| --- | --- | --- |
| Published imported Place appears in eligibility search | Not run | |
| Place can be selected and validation succeeds | Not run | |
| Hotspot creation succeeds | Not run | |
| `hotspot_placed` audit found | Not run | |

**Hotspot ID / audit ID:**

## Part J — Failure handling

Use controlled test cases in an isolated or otherwise approved environment.
Do not deliberately cause failures in production unless separately authorized.

| Scenario | Expected outcome | Result (Pass / Fail / Not run) | Evidence / audit ID |
| --- | --- | --- | --- |
| Outside-city object | Quarantined; no Civic Place created | Not run | |
| Missing coordinates | Quarantined and audited | Not run | |
| Duplicate source identity | Existing record reused/recognized; duplicate tracked | Not run | |
| Worker failure after staging | Partial state traceable; retry/abort path possible | Not run | |

## Findings and blockers

| Severity | Finding / blocker | Owner | Resolution / follow-up |
| --- | --- | --- | --- |
| | | | |

## Acceptance decision

- [ ] **Accepted** — all required checks passed and evidence is recorded.
- [ ] **Rejected** — one or more required checks failed.
- [ ] **Blocked** — not all checks could be run or evidence is incomplete.

**Decision rationale:**  
**Approver(s):**  
**Date:**

## Implementation references

- [Governed OSM ingestion operations](./AI_INGESTION.md#implemented-osm-place-mvp)
- [City Admin review and lifecycle workflow](./CITY_ADMIN_WORKFLOW.md)
- [OSM ingestion integration test](../tests/osm-ingestion.integration.sql)
- [OSM boundary registry migration](../supabase/migrations/20261119220000_osm_boundary_registry.sql)
- [OSM Place ingestion migration](../supabase/migrations/20261119220100_osm_place_ingestion.sql)
