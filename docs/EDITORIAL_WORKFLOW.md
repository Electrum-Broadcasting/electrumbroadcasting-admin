# EDITORIAL_WORKFLOW
# Electrum — Editorial Lifecycle Specification
# Last updated: 2026-09-01

---

## Table of Contents

1. [Overview](#1-overview)
2. [Roles and Permissions](#2-roles-and-permissions)
3. [Story Lifecycle States](#3-story-lifecycle-states)
4. [Stage 1 — Story Submission](#4-stage-1--story-submission)
5. [Stage 2 — Editor Review](#5-stage-2--editor-review)
6. [Stage 3 — Revision Request](#6-stage-3--revision-request)
7. [Stage 4 — Approval](#7-stage-4--approval)
8. [Stage 5 — Rejection and Unpublishable Criteria](#8-stage-5--rejection-and-unpublishable-criteria)
9. [Stage 6 — City Admin Handoff and Publication](#9-stage-6--city-admin-handoff-and-publication)
10. [Secondary Object Management (v4)](#10-secondary-object-management-v4)
11. [Field Reference by Actor](#11-field-reference-by-actor)
12. [Workflow Diagram](#12-workflow-diagram)
13. [Error States and Escalation](#13-error-states-and-escalation)

---

## 1. Overview

Electrum operates a two-tier editorial system. **Editors** own content quality — they review submissions, request revisions, approve, or reject stories. **City Admins** own final publication authority and manage all financial and budget objects introduced in DATA-MODEL v4 (`production_units`, `payout_batches`, `payout_batch_items`, ‘city_budget`, `sponsor_allocations`).

**Core constraint:** Editors can never transition a story to `published`. Only City Admins
can execute the final publish action after an Editor has set `review_status = approved`.
---
## 2. Roles and Permissions

### 2.1 Editor

| Permitted Action                          | Fields Written                                                      |
|-------------------------------------------|---------------------------------------------------------------------|
| Begin review of a submitted story         | `review_status` → `in_review`                                       |
| Request revisions from contributor        | `review_status` → `revision_requested`, `revision_requested = true`, `revision_notes` |
| Approve a story                           | `review_status` → `approved`, `review_notes`, `reviewed_at`         |
| Reject a story                            | `review_status` → `rejected`, `review_notes`, `reviewed_at`         |
| Mark a story unpublishable                | `review_status` → `unpublishable`, `review_notes`, `reviewed_at`    |
| Clear a prior revision request            | `revision_requested = false`, `revision_notes` (cleared)            |

**Editors cannot:**
- Set `review_status = published`
- Create, modify, or delete `production_units`
- Create, modify, or delete `payout_batches` or `payout_batch_items`
- Modify `city_budget` or `sponsor_allocations`
- Reassign a story to another city

### 2.2 City Admin

| Permitted Action                          | Notes                                                               |
|-------------------------------------------|---------------------------------------------------------------------|
| Publish an approved story                 | Only valid when `review_status = approved`                          |
| Unpublish a live story                    | Reverts to `review_status = approved` pending re-publish decision   |
| Create / edit / delete `production_units` | v4 object; scoped to their city                                     |
| Create / close `payout_batches`           | Must reference valid `production_units`                             |
| Add / remove `payout_batch_items`         | Line items within an open `payout_batch`                            |
| Set and adjust `city_budget`              | Budget ceiling for their city                                       |
| Manage `sponsor_allocations`              | Assign sponsor funds to stories or production units                 |
| Override `review_status` (emergency)      | Audit log entry required; restricted to `rejected` or `unpublishable` overrides only |

---

## 3. Story Lifecycle States

submitted → in_review → revision_requested → in_review (loop) → approved → published → rejected → unpublishable

| `review_status`      | Set By      | Meaning                                                                 |
|----------------------|-------------|-------------------------------------------------------------------------|
| `submitted`          | System      | Contributor has submitted; no Editor has claimed it                     |
| `in_review`          | Editor      | An Editor has opened and is actively reviewing                          |
| `revision_requested` | Editor      | Editor has returned the story to the contributor with notes              |
| `approved`           | Editor      | Editor has passed the story; ready for City Admin to publish             |
| `rejected`           | Editor      | Story does not meet standards; contributor notified; case closed         |
| `unpublishable`      | Editor      | Story cannot be published for structural/legal/policy reasons (see §8)  |
| `published`          | City Admin  | Story is live; `production_units` may now be attached                   |

---

## 4. Stage 1 — Story Submission

### 4.1 Contributor Actions
- Contributor creates a story record with all required metadata fields populated.
- System sets `review_status = submitted` and records `submitted_at`.
- `revision_requested` defaults to `false`; `revision_notes` is null.

### 4.2 Assignment
- Stories enter the city's editorial queue ordered by `submitted_at` ascending.
- An Editor claims a story explicitly; claiming sets `review_status = in_review`.
- A story cannot be simultaneously claimed by two Editors. Claiming is atomic.

### 4.3 Submission Validation (system-enforced)
A story is rejected at submission if any of the following are true:
- Required metadata fields are empty (title, body, contributor ID, city ID).
- Story body is below the minimum word threshold configured per city.
- Contributor account is suspended or unverified.

---

## 5. Stage 2 — Editor Review

### 5.1 Review Checklist (non-exhaustive; policy document governs)
Editors evaluate:
- Factual accuracy and sourcing
- Adherence to Electrum style guide
- Appropriate length and structure
- No conflict of interest with sponsor allocations active in the city
- Legal and policy compliance (see §8 for hard stops)

### 5.2 Fields Updated During Review

review_status = "in_review" // set on claim review_notes = <editor commentary> // incremental; replaces prior value on each save reviewed_at = <timestamp> // set on any terminal action (approved/rejected/unpublishable)

### 5.3 Review Time Limits
- **Standard queue:** Editor must take a terminal action within **5 business days** of claiming.
- **Expedited queue:** 48 hours (City Admin configurable per city).
- Overdue stories resurface in the queue and may be reassigned by the City Admin.

---

## 6. Stage 3 — Revision Request

### 6.1 Triggering a Revision

The Editor sets:
review_status = "revision_requested" revision_requested = true revision_notes = "<clear, actionable instructions for contributor>"

`reviewed_at` is **not** set at this stage — it is only written on terminal actions.

### 6.2 Revision Rules
- `revision_notes` is **required** and must be non-empty when `revision_requested = true`.
- The Editor must specify at minimum one of: factual correction, structural change, or
  policy compliance item.
- A story may undergo a maximum of **3 revision cycles** before the Editor must either
  approve, reject, or escalate to City Admin.

### 6.3 Contributor Response
- Contributor updates the story body and/or metadata.
- Contributor re-submits, which sets `revision_requested = false` and `revision_notes` to null
  (system action on re-submit).
- `review_status` returns to `in_review`; the same Editor is notified.
- If the same Editor is unavailable, City Admin may reassign.

### 6.4 Revision Cycle Limit
On the 3rd returned revision without resolution:
- The story is flagged `revision_limit_reached = true` (v3.2 field).
- System notifies City Admin.
- Editor must take a terminal action (approve / reject / unpublishable) within 48 hours or
  City Admin may intervene.

---

## 7. Stage 4 — Approval

### 7.1 Approval Criteria (all must be satisfied)
1. Story passes all review checklist items (§5.1).
2. No open revision requests (`revision_requested = false`).
3. Story body meets city-configured word minimum.
4. No active legal hold on the contributor or story.
5. Sponsor conflict check passes — no `sponsor_allocations` record links a story sponsor
   to a story subject in a conflicted manner (system flag; Editor confirms clearance).

### 7.2 Fields Written on Approval

review_status = "approved" review_notes = "<final editorial note — required>" reviewed_at = <UTC timestamp>

`revision_requested` and `revision_notes` must be `false` / null at time of approval;
system will reject the write otherwise.

### 7.3 Post-Approval
- Story enters the City Admin **publication queue** ordered by `reviewed_at` ascending.
- Editor's responsibility ends. No further Editor-writable fields change unless City Admin
  invokes an emergency override (§2.2).
- City Admin is notified (in-app + email digest) that a story is pending publication.

---

## 8. Stage 5 — Rejection and Unpublishable Criteria

### 8.1 Rejection (`review_status = rejected`)

Use rejection when the story **could theoretically be fixed** but the contributor has not
met standards after reasonable effort, or the topic is no longer timely.

**Rejection triggers:**
- Contributor failed to address revision notes after the maximum revision cycle.
- Story is factually inaccurate in a way the Editor cannot verify will be corrected.
- Story duplicates recently published content in the same city.
- Contributor withdrew consent post-submission.

**Fields written:**

review_status = "rejected" review_notes = "<reason for rejection — required; shown to contributor>" reviewed_at = <UTC timestamp>

A rejected story is **closed**. It cannot re-enter the queue unless City Admin explicitly
reactivates it (creates a new submission record referencing `original_story_id`).

---

### 8.2 Unpublishable (`review_status = unpublishable`)

Use `unpublishable` when a story **cannot be published under any circumstances** due to
structural, legal, or safety reasons that are independent of content quality.

**Mandatory unpublishable criteria (hard stops):**

| Category              | Examples                                                              |
|-----------------------|-----------------------------------------------------------------------|
| Legal hold            | Active litigation referencing the story, subject, or contributor      |
| Safety risk           | Story exposes location or identity of a protected individual          |
| Privacy / data breach | Contains non-consented PII, health data, or minor identification      |
| Intellectual property | Plagiarism confirmed; unlicensed copyrighted material                 |
| Platform policy       | Content violates Electrum Terms of Service (hate, harassment, CSAM)  |

**Fields written:**

review_status = "unpublishable" review_notes = "<specific legal/policy/safety basis — required>" reviewed_at = <UTC timestamp>

An `unpublishable` story is **permanently closed** in the system. City Admin cannot
override to `published` directly; override is limited to `rejected` (see §2.2).
Unpublishable records are retained for audit purposes and cannot be hard-deleted by
any role.

---

## 9. Stage 6 — City Admin Handoff and Publication

### 9.1 Pre-Publication Checklist (City Admin)

Before publishing, City Admin confirms:
- [ ] `review_status = approved`
- [ ] `reviewed_at` is populated
- [ ] `review_notes` is non-empty
- [ ] `revision_requested = false`
- [ ] No active legal hold (system flag)
- [ ] `city_budget` has sufficient remaining capacity if story is linked to a `production_unit`
- [ ] Any `sponsor_allocations` attached to this story are in `active` status

### 9.2 Publication Action

City Admin executes publish; system writes:

review_status = "published" published_at = <UTC timestamp> published_by = <city_admin_id>

No Editor fields are modified at publication time.

### 9.3 Post-Publication: Production Unit Attachment

After publication, City Admin may attach a `production_unit` to the story:

production_units: story_id = <story.id> city_id = <city.id> unit_type = "article" | "video" | "photo_essay" | ... unit_rate = <decimal> contributor_id = <contributor.id> payout_batch_id = <payout_batch.id> // assigned when batch is created/open status = "pending" | "batched" | "paid"

`production_units` are the billing record for a published story. They must not be created
before `review_status = published`.

### 9.4 Unpublishing

City Admin may unpublish a live story:
- `review_status` reverts to `approved`.
- `published_at` and `published_by` are preserved in audit log.
- Associated `production_unit` is set to `status = suspended` pending City Admin action.
- Active `payout_batch_items` referencing the story are flagged for review; payout is
  blocked until the story is re-published or the item is removed from the batch.

---

## 10. Secondary Object Management 

All objects in this section are **City Admin only**. Editors have read-only visibility
where noted.

### 10.1 `city_budget`

city_budget: city_id : FK → cities fiscal_period : string (e.g. "2026-Q3") total_budget : decimal allocated : decimal // sum of sponsor_allocations.amount for period spent : decimal // sum of payout_batch_items.amount for period remaining : computed (total_budget - spent)

- City Admin sets `total_budget` at the start of each fiscal period.
- `allocated` and `spent` are system-computed; never written directly.
- A `production_unit` cannot be attached to a story if `city_budget.remaining < unit_rate`.
- Editors may view `remaining` as a read-only field in the editorial dashboard.

### 10.2 `sponsor_allocations`

sponsor_allocations: id : uuid PK city_id : FK → cities sponsor_id : FK → sponsors story_id : FK → stories (nullable; null = city-level allocation) amount : decimal status : "pending" | "active" | "exhausted" | "cancelled" valid_from : date valid_until : date

- City Admin creates allocations before or after story submission; linking to a story
  is optional.
- A story-linked allocation in `active` status must be cleared or cancelled before that
  story can be `rejected` or `unpublishable` (system warning; City Admin override allowed
  with audit log).
- Editors see sponsor name (read-only) on stories with an active allocation to perform
  conflict-of-interest checks.

### 10.3 `payout_batches`

payout_batches: id : uuid PK city_id : FK → cities status : "open" | "submitted" | "processing" | "paid" | "failed" period_start : date period_end : date created_by : FK → city_admins submitted_at : timestamp (nullable) paid_at : timestamp (nullable)

- City Admin opens a batch for a fiscal period and adds items.
- A batch moves from `open` → `submitted` when City Admin submits for processing.
- Only `open` batches accept new `payout_batch_items`.

### 10.4 `payout_batch_items`

payout_batch_items: id : uuid PK payout_batch_id : FK → payout_batches production_unit_id : FK → production_units contributor_id : FK → contributors amount : decimal // typically = production_unit.unit_rate status : "pending" | "approved" | "blocked" | "paid"

- Items are added automatically when a `production_unit` is assigned a `payout_batch_id`.
- An item is `blocked` if the referenced story is unpublished after batching.
- `amount` must not exceed `city_budget.remaining` at time of item creation.

---

## 11. Field Reference by Actor

### Editor-Writable Fields (story record)

| Field                | Type      | Set When                                          |
|----------------------|-----------|---------------------------------------------------|
| `review_status`      | enum      | On any review action                              |
| `review_notes`       | text      | Required on approve / reject / unpublishable      |
| `revision_requested` | boolean   | `true` on revision request; `false` on re-submit  |
| `revision_notes`     | text      | Required when `revision_requested = true`; null otherwise |
| `reviewed_at`        | timestamp | Set only on terminal actions (approve/reject/unpublishable) |

### City Admin-Writable Fields (story record)

| Field          | Type      | Set When                    |
|----------------|-----------|-----------------------------|
| `review_status`| enum      | Publication, unpublish, emergency override |
| `published_at` | timestamp | On publish                  |
| `published_by` | FK        | On publish                  |

### System-Written Fields (neither role writes directly)

| Field              | Written By System When                         |
|--------------------|------------------------------------------------|
| `submitted_at`     | Contributor submits                            |
| `revision_count`   | Incremented on each `revision_requested` write |
| `revision_limit_reached` | `revision_count` reaches configured max  |

---

## 12. Workflow Diagram

[Contributor] │ │ submit() ▼ ┌──────────────┐ │ submitted │◄──────────────────────────────────────────────┐ └──────┬───────┘ │ │ Editor.claim() │ ▼ │ ┌──────────────┐ │ │ in_review │◄─────────────────────────────┐ │ └──────┬───────┘ │ │ │ │ │ ┌───┴───┐ │ │ │ │ │ │ ▼ ▼ │ │ request approve ──────────────────► ┌──────────────┐ │ revision reject ──────────────────► │ approved │ │ unpublish ─────────────────► │ rejected │ │ │ │unpublishable │ │ │ └──────┬───────┘ │ ▼ │ │ ┌───────────────────────┐ │ CityAdmin │ │ revision_requested │──re-submit()──► │ .publish() │ └───────────────────────┘ ▼ │ ┌──────────────┐ │ │ published │─unpublish()─┘ └──────────────┘

---

## 13. Error States and Escalation

| Condition                              | Responsible Party | Resolution Path                                        |
|----------------------------------------|-------------------|--------------------------------------------------------|
| Story stuck in `in_review` > SLA limit | City Admin        | Reassign to another Editor via admin console            |
| Revision limit reached                 | Editor + City Admin | Editor must take terminal action; City Admin notified  |
| `payout_batch_item` blocked by unpublish | City Admin      | Re-publish story or remove item from batch manually    |
| `sponsor_allocation` conflict warning  | Editor (flag) + City Admin (resolve) | City Admin cancels/modifies allocation    |
| `city_budget.remaining` insufficient   | City Admin        | Increase budget ceiling or defer production unit       |
| Emergency override of `unpublishable`  | City Admin        | Audit log written; legal review recommended            |
| Duplicate submission detected          | System → Editor   | Editor rejects duplicate; links canonical story ID     |

---

*This document is authoritative for all Electrum editorial workflow implementations.
Changes must be reviewed by the Editorial Lead and City Admin Product Owner before merging.*
________________________________________
Key design decisions reflected in this draft:
•	Hard role boundary at published — the enum transition from approved → published is the only action gated exclusively to City Admin; every other status is Editor-writable, making the handoff clean and auditable.
•	reviewed_at written only on terminal actions — prevents a stale timestamp from appearing after revision cycles.
•	production_units gate on published status — billing records can't precede a live story, protecting payout_batch_items from dangling references.
•	revision_notes nulled on re-submit — prevents old instructions from lingering and confusing the next review pass.
•	unpublishable is permanent at the story level — City Admin override is bounded to rejected, never directly to published, maintaining the legal/safety intent of the flag.

