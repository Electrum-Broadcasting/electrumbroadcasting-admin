PUBLICATION_AND_PAYOUT.md
Electrum Internal Specification — 
Compatibility: DATA_MODEL.md · EDITORIAL_WORKFLOW.md · RATE_CARD.md 
Last Updated: 2026 09 03
1. Overview
This document defines how Electrum moves a story from editorial approval to public publication, how production value is recorded through production_units, and how Contributor and Editor payouts are batched, authorized, and disbursed.
This specification supplements:
•	EDITORIAL_WORKFLOW.md — governs draft → review → approval
•	DATA_MODEL.md — governs tables, fields, RLS, RPCs
Where conflicts exist, DATA_MODEL.md is authoritative on schema; this document is authoritative on workflow.
2. Roles & Authorities
Role	Publication Rights	Payout Rights
Contributor	None	Receives payout for published stories
Editor	Approves stories only	Receives payout for editing published stories
City Admin	Publishes approved stories; manages production_units; assembles payout_batches	Cannot authorize disbursement
CEO	No publication rights	Authorizes payout_batches
Separation of duties: City Admin assembles batches; CEO authorizes them.
3. Publication Lifecycle
3.1 Preconditions for Publication
A story may be published only if:
1.	review_status = 'approved' (EDITORIAL WORKFLOW §7)
2.	city_id references an active city
3.	City budget has sufficient remaining balance (see §6)
4.	No legal or safety hold exists
3.2 Publication Action (City Admin)
Publishing a story performs the following atomically:
1.	Sets review_status = 'published'
2.	Sets published_at and published_by
3.	Creates a production_unit
4.	Debits city_budget by production_unit.net_city_cost
5.	Applies sponsor credit if applicable
6.	Creates payout_batch_item candidates
7.	Emits a story.published event
3.3 Visibility
Published stories are immediately visible in the city’s public UI.
3.4 Unpublishing
City Admin may unpublish a story:
•	review_status reverts to approved
•	production_unit remains intact
•	City budget debit is not reversed
•	If payout_batch_item is still pending, City Admin may remove it with a required note
•	If payout_batch is already authorized, payout cannot be reversed
4. Production Economy
4.1 What is a production_unit?
A production_unit is the financial record created at publication time. It defines:
•	gross_cost
•	sponsor_credit
•	net_city_cost
•	contributor_payout
•	editor_payout
•	settlement status
4.2 v1 Schema (Aligned with DATA_MODEL.md)
Field	Description
gross_cost	Total cost of the story
sponsor_credit	Amount covered by sponsor allocation
net_city_cost	gross_cost − sponsor_credit
contributor_payout	Contributor’s share
editor_payout	Editor’s share
status	open → in_progress → complete → cancelled
settled_at	Timestamp when payout is fully completed
4.3 Cost Calculation (v1)
Electrum v1 uses a fixed rate card per city.  (See: RATE_CARD.MD)
Invariant: gross_cost = contributor_payout + editor_payout
4.4 Sponsor Credit (v1)
Sponsor credit is applied only if:
•	sponsor allocation exists
•	sponsor allocation is active
•	sponsor allocation matches the story’s city
Sponsor credit reduces city budget debit, not payee payouts.
5. Payout Batching
5.1 Batch Creation (v1)
City Admin manually creates batches:
1.	City Admin clicks Create Payout Batch
2.	System sweeps all pending payout_batch_items
3.	Batch enters status = 'pending_authorization'
4.	CEO is notified
No schedules. No windows. No automation.
5.2 CEO Authorization
CEO reviews:
•	total amount
•	item count
•	city
•	period
CEO authorizes or rejects the entire batch.
5.3 Stripe Disbursement (v1)
Upon authorization:
1.	Batch enters processing
2.	Each payout_batch_item triggers a Stripe Transfer
3.	Items become paid or failed
4.	When all items are terminal, batch becomes completed
5.	production_unit.status becomes settled
6. City Budget Enforcement
6.1 v1 Schema (Aligned with DATA_MODEL.md)
Field	Description
total_budget_cents	Total budget for the period
allocated_cents	Sum of sponsor allocations
spent_amount_cents	Sum of net_city_cost for published stories
remaining_amount_cents	total_budget − spent_amount
6.2 Budget Check at Publication
If remaining_amount_cents < net_city_cost:
•	Publication is blocked
•	City Admin receives a shortfall error
No overage policies in v1.
7. Sponsor Allocation Rules (v1)
7.1 v1 Schema (Aligned with DATA_MODEL.md)
Field	Description
city_id	City scope
sponsor_id	Sponsor
amount_cents	Total allocation
notes	Optional notes
status	active or cancelled
7.2 v1 Sponsor Credit Logic
Sponsor credit is applied only if:
•	allocation.status = active
•	allocation.city_id = story.city_id
Credit amount:
sponsor_credit = MIN(allocation.amount_cents_remaining, gross_cost)
Allocation counters update:
•	allocated_cents increases
•	remaining allocation decreases
8. Stripe Payout Flow (v1)
8.1 Requirements
•	Payees must have connected Stripe accounts
•	Electrum must have sufficient balance
8.2 Flow
1.	CEO authorizes batch
2.	Batch enters processing
3.	Stripe transfers execute
4.	Items become paid or failed
5.	Batch becomes completed
6.	production_unit becomes settled
8.3 Failure Handling
•	Failed items remain failed
•	City Admin may re queue failed items into a new batch
9. Edge Cases & Guardrails
9.1 No Self Publishing
City Admin cannot publish without Editor approval.
9.2 Duplicate Publication
Publishing an already published story returns a conflict error.
9.3 Deleted Payees
If payee account is deleted, payout_batch_item becomes failed.
9.4 Currency
All values stored in USD cents.
9.5 Audit Trail
All status transitions logged in admin_action_logs.
10. Glossary

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


