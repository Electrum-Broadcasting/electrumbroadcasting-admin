# PUBLICATION_AND_PAYOUT.md
Electrum Internal Specification — 
Compatibility: DATA_MODEL.md · EDITORIAL_WORKFLOW.md · RATE_CARD.md 

## 1. Overview
This document defines how Electrum moves a story from editorial approval to public publication, how production value is recorded through production_units, and how Contributor and Editor payouts are batched, authorized, and disbursed.
This specification supplements:
•	EDITORIAL_WORKFLOW.md — governs draft → review → approval
•	DATA_MODEL.md — governs tables, fields, RLS, RPCs
Where conflicts exist, DATA_MODEL.md is authoritative on schema; this document is authoritative on workflow.

## 2. Roles & Authorities
Role	Publication Rights	Payout Rights
Contributor	None	Receives payout for published stories
Editor	Approves stories only	Receives payout for editing published stories
City Admin	Publishes approved stories; manages production_units; assembles payout_batches	Cannot authorize disbursement
CEO	No publication rights	Authorizes payout_batches
Separation of duties: City Admin assembles batches; CEO authorizes them.

CEO administrative unpublish does not affect production_units or payout_batches.

CEO Administrative Visibility Controls
The CEO may:

freeze/unfreeze stories

hide/unhide stories

emergency unpublish stories

override City Admin visibility decisions

enforce safety holds

resolve escalations

These actions do not modify editorial publication fields or payout structures.

## 3. Publication Lifecycle
### 3.1 Preconditions for Publication
A story may be published only if:
1.	review_status = 'approved' (EDITORIAL WORKFLOW §7)
2.	city_id references an active city
3.	City budget has sufficient remaining balance (see §6)
4.	No legal or safety hold exists

### 3.2 Publication Action (City Admin)
Publishing a story performs the following atomically:
1.	Sets review_status = 'published'
2.	Sets published_at and published_by
3.	Creates a production_unit with content_tier selected by the City Admin.
3a. 	Applies RATE_CARD cost and payout fields based on production_unit.content_tier.
4.	Publication is blocked if civic_stories.safety_hold = true.
5.	Debits city_budget by production_unit.net_city_cost
6.	Applies sponsor credit if applicable
7.	Creates payout_batch_item candidates
8.	Emits a story.published event

### 3.3 Visibility
Published stories are immediately visible in the city’s public UI.

### 3.4 Unpublishing
City Admin may unpublish a story:
•	review_status reverts to approved
•	production_unit remains intact
•	City budget debit is not reversed
•	If payout_batch_item is still pending, City Admin may remove it with a required note
•	If payout_batch is already authorized, payout cannot be reversed

## 4. Production Economy
### 4.1 What is a production_unit?
A production_unit is the financial record created at publication time. It defines:
•	id uuid not null default gen_random_uuid (),
•	city_id uuid not null,
•	city_budget_id uuid null,
•	created_by uuid not null,
•	title text not null,
•	description text null,
•	unit_type text null,
•	gross_cost bigint null,
•	net_city_cost bigint null,
•	sponsor_credit bigint null,
•	target_payout_cents bigint null,
•	contributor_payout bigint null,
•	editor_payout bigint null,
•	status text not null default 'open'::text,
•	content_tier — Required tier classification ('standard' | 'feature' | 'investigation') determining cost and payout fields.
•	due_date date null,
•	created_at timestamp with time zone not null default now(),
•	updated_at timestamp with time zone not null default now(),
•	settled_at timestamp with time zone null,

### 4.2 Schema (Aligned with DATA_MODEL.md)
Field	Description
gross_cost	Total cost of the story
sponsor_credit	Amount covered by sponsor allocation
net_city_cost	gross_cost − sponsor_credit
contributor_payout	Contributor’s share
editor_payout	Editor’s share
status	open or submitted or editor_approved or city_published or rejected or unpublishable
settled_at	Timestamp when payout is fully completed

### 4.3 Cost Calculation 
Electrum v1 uses a fixed rate card per city.  (See: RATE_CARD.MD)
Invariant: gross_cost = contributor_payout + editor_payout
Cost calculation is driven by production_unit.content_tier according to RATE_CARD.md.

### 4.4 Sponsor Credit 
Sponsor credit is applied only if:
•	sponsor allocation exists
•	no soft-cancel note is present on the allocation
•	sponsor allocation matches the story’s city
Sponsor credit reduces city budget debit, not payee payouts.

## 5. Payout Batching
### 5.1 Batch Creation 
City Admin manually creates batches:
1.	City Admin clicks Create Payout Batch
2.	System sweeps all pending payout_batch_items
3.	Batch enters status = 'pending'
4.	CEO is notified
No schedules. No windows. No automation.

### 5.2 CEO Authorization
CEO reviews:
•	total amount
•	item count
•	city
•	period
CEO authorizes or rejects the entire batch.

### 5.3 Stripe Disbursement 
Upon authorization:
1.	Batch enters processing
2.	Each payout_batch_item triggers a Stripe Transfer
3.	Items become paid or failed
4.	When all items are terminal, batch becomes completed
5.	production_unit.status becomes city_published

## 6. City Budget Enforcement
### 6.1 Schema (Aligned with DATA_MODEL.md)
  Table: city_budget
  id uuid not null default gen_random_uuid (),
  city_id uuid not null,
  fiscal_year integer not null,
  period_label text null,
  total_budget_cents bigint not null,
  allocated_cents bigint not null default 0,
  spent_amount_cents bigint not null default 0,
  remaining_cents bigint GENERATED ALWAYS as ((total_budget_cents - allocated_cents)) STORED COMPUTED Derived column; do not write directly.
  status text not null default 'active'::text,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

### 6.2 Budget Check at Publication
If remaining_amount_cents < net_city_cost:
•	Publication is blocked
•	City Admin receives a shortfall error
No overage policies in v1.

## 7. Sponsor Allocation Rules 
### 7.1 v1 Schema (Aligned with DATA_MODEL.md)
Field	Description
city_id	City scope
sponsor_id	Sponsor
amount_cents	Total allocation
notes	Optional notes

### 7.2 v1 Sponsor Credit Logic
Sponsor credit is applied only if:
•	allocation.status = active
•	allocation.city_id = story.city_id
Credit amount:
sponsor_credit = MIN(allocation.amount_cents_remaining, gross_cost)
Allocation counters update:
•	allocated_cents increases
•	remaining allocation decreases

## 8. Stripe Payout Flow (v1)
### 8.1 Requirements
•	Payees must have connected Stripe accounts
•	Electrum must have sufficient balance

### 8.2 Flow
1.	CEO authorizes batch
2.	Batch enters processing
3.	Stripe transfers execute
4.	Items become paid or failed
5.	Batch becomes completed
6.	production_unit becomes settled

### 8.3 Failure Handling
•	Failed items remain failed
•	City Admin may re queue failed items into a new batch

## 9. Edge Cases & Guardrails
### 9.1 No Self Publishing
City Admin cannot publish without Editor approval.

### 9.2 Duplicate Publication
Publishing an already published story returns a conflict error.

#### 9.3 Deleted Payees
If payee account is deleted, payout_batch_item becomes failed.

### 9.4 Currency
All values stored in USD cents.

### 9.5 Audit Trail
All status transitions logged in admin_action_logs.

## 10. Glossary

| Term                    | Definition                                                            |
|-------------------------|-----------------------------------------------------------------------|
| `production_unit`       | Financial record created at publication capturing cost splits         |
| `payout_batch`          | A grouped collection of payout items authorized in one CEO action     |
| `payout_batch_item`     | A single payee line within a batch representing one production split  |
| `city_budget`           | Per-city, per-fiscal-period budget tracking gross publication spend    |
| `sponsor_allocation`    | A sponsor's pre-committed credit applied to reduce city budget debits |
| `gross_cost`            | Total story cost before sponsor credit                                |
| `net_city_cost`         | Cost charged to city budget after sponsor credit                      |
| `sponsor_credit`        | Portion of gross cost covered by a matched sponsor allocation         |
| `platform_fee`          | Electrum's retained portion of each story's gross cost                |
| `overage_policy`        | City-level rule governing behavior when budget balance is insufficient |
| `stripe_batch_id`       | Stripe Transfer Group ID linking all transfers in one payout batch    |
| `fiscal_period`         | Budget accounting period (e.g., `"2026-Q3"`)                          |
| `content_tier`          | Story classification driving rate card lookups                        |
| `platform_suspense`     | Holding ledger for funds with no valid payee                          |

## 11. Publication Queue

### 11.1 Purpose
The Publication Queue is the ordered list of civic_stories with review_status = approved
awaiting City Admin publication. This section defines the queue's behavior, ordering, and
City Admin interaction model.

### 11.2 Queue Population
- A story enters the queue when an Editor sets review_status = approved
  (EDITORIAL_WORKFLOW.md §7).
- Stories are ordered by reviewed_at ascending (oldest approval first).
- A story exits the queue when City Admin publishes it (review_status = published) or
  places it on a safety hold.
- Unpublished stories re-enter the queue at their original reviewed_at position.

### 11.3 City Admin View
City Admins see only stories scoped to their city_id. The queue displays:
- Story title
- Contributor name (contributor_id → admin_users)
- Editor name (editor_id → admin_users)
- reviewed_at timestamp
- Assigned content tier (if pre-selected)
- Budget availability indicator (remaining_cents vs. estimated net_city_cost)

### 11.4 Tier Selection at Publication
City Admin must select a content tier (standard | feature | investigation) before the
publish action can execute. Tier selection determines gross_cost, contributor_payout, and
editor_payout per RATE_CARD.md §3. Tier cannot be changed after the production_unit is
created.
City Admin must select a content_tier before publication. Tier selection is persisted to production_units.content_tier and logged as tier_selected.

### 11.5 Publication Gate
The system enforces all preconditions defined in §3.1 at the moment of the publish action.
If any precondition fails, publication is blocked and the City Admin receives a specific
error (BUDGET_SHORTFALL, SAFETY_HOLD_ACTIVE, REVIEW_STATUS_MISMATCH).
Publication is blocked when safety_hold = true.

### 11.6 Audit
All queue interactions (publish, unpublish, hold placement) are written to
admin_action_logs with domain = editorial and entity_type = civic_stories
(DATA_MODEL.md §10).

---

## 12. Budget & Sponsors

### 12.1 Purpose
This section provides an operational reference for City Admins and the CEO on how
city_budget and sponsor_allocations interact with the publication and payout lifecycle.
It supplements §6 (City Budget Enforcement) and §7 (Sponsor Allocation Rules) with
workflow-level operational rules.

### 12.2 city_budget Lifecycle
A city_budget record covers one fiscal period (fiscal_year + period_label).

| Status | Meaning                                                                                 |
|--------|-----------------------------------------------------------------------------------------|
| draft  | Budget created but not yet active; no publication charges may be applied                |
| active | Budget is live; publications debit spent_amount_cents                                   |
| closed | Period ended; no new debits allowed; existing payout_batches may still complete         |

Only one city_budget per city_id may have status = 'active' at a time.

### 12.3 Budget Debit at Publication
When City Admin executes the publish action:
1. System checks remaining_cents ≥ net_city_cost (§6.2).
2. On success, spent_amount_cents is incremented by net_city_cost.
3. remaining_cents is GENERATED ALWAYS AS (total_budget_cents - allocated_cents) and is
   never written directly (DATA_MODEL.md §3, city_budget). Do not write to this column.
4. recalculate_city_budget(city_id) RPC may be called to recompute allocated_cents and
   spent_amount_cents from source records after any manual correction.

### 12.4 sponsor_allocation Interaction
Sponsor credits reduce net_city_cost and therefore the city budget debit. They do not
affect contributor_payout or editor_payout (RATE_CARD.md §4).

Allocation matching rules (v1):
- No soft-cancel note is present on the allocation record.
- allocation.city_id must equal story.city_id.
- sponsor_credit = MIN(allocation.amount_cents_remaining, gross_cost).
- allocation.allocated_cents increments by sponsor_credit on application.

The system applies sponsor credit automatically during the atomic publish action (§3.2
step 5). City Admin does not manually select or apply sponsor credit.

### 12.5 Payout Batch and Budget Relationship
Each payout_batch must reference a city_budget via city_budget_id. A payout_batch may
only be created against a city_budget with status = 'active' (enforced via RPC).

When a batch reaches status = 'paid':
- All production_unit records referenced by items in the batch record settled_at.
- production_unit.status transitions to city_published (DATA_MODEL.md §3).

### 12.6 City Admin Permissions on sponsor_allocations
- City Admins may SELECT sponsor_allocations for their city to view available credit,
  check allocation balance, and verify remaining capacity before publication.
- City Admins may NOT INSERT, UPDATE, or DELETE sponsor_allocations.
  Sponsor allocation management (creation, modification, cancellation) is a CEO-level
  operation (DATA_MODEL.md §3, sponsor_allocations RLS Notes).
- During the publish action, the system automatically identifies and applies any matching
  active allocation for the story's city_id. This is system-executed; City Admin does
  not manually apply or select sponsor credit.
- City Admins may NOT authorize payout disbursement (CEO only, per §2 Role table).
- City Admins may NOT UPDATE city_budget fields directly; counters are system-maintained
  via trigger or RPC (DATA_MODEL.md §7.5.d).

### 12.7 Audit
All budget-affecting events generate entries in admin_action_logs with domain = budget.
This includes:

| Event                           | action string logged              |
|---------------------------------|-----------------------------------|
| Publication debit applied       | story_published                   |
| Sponsor credit applied          | sponsor_credit_applied            |
| Payout batch created            | payout_batch_created              |
| Payout batch item added         | payout_batch_item_added           |
| Payout batch item removed       | payout_batch_item_removed         |
| Payout batch authorized by CEO  | payout_batch_authorized           |
| Payout batch rejected by CEO    | payout_batch_rejected             |

