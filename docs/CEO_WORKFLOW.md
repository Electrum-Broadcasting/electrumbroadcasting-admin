# CEO_WORKFLOW.md 

## 1. Purpose & Scope
Defines the responsibilities, permissions, and workflows for the CEO across all Electrum domains:
•	global governance
•	theme/brand publishing
•	ingestion escalation resolution
•	editorial oversight
•	payout authorization
•	safety enforcement
•	cross city consistency
•   	search index governance and cross-city search oversight
•   	immersive media governance (panoramas, hotspots, cross-city links)
The CEO is the final authority for all cities.

## 2. Role Definition
### 2.1 Permissions
CEO may:
•	SELECT/UPDATE all civic_* tables
•	SELECT raw_ingestion
•	SELECT/UPDATE civic_object_suggestions
•	publish brand settings
•	publish themes
•	resolve escalations
•	override City Admin decisions
•	approve payouts
•	update global settings
•	manage roles
•	manage safety settings
•   	full CRUD on sponsor_profiles (brand_safety_status, good_standing_status)
•   	full CRUD on sponsorship_campaigns across all cities
•  	activate and terminate campaigns via rpc_activate_campaign / rpc_expire_campaign
•   	full CRUD on creative_assets across all cities
•   	hard-delete hotspots after 24 h (City Admin cannot)
•   	create cross-city hotspot links (City Admin cannot)
•   	trigger rpc_reindex_city for any city
•   	modify search ranking weights (city_prompts.search_ranking_weights) for any city
•   	view search_index rows across all cities including unpublished rows

### 2.2 Restrictions
CEO may NOT:
•	bypass RLS for anon/public
•	modify ingestion payloads directly
•	publish stories (editorial domain)

## 3. Ingestion Governance
### 3.1 Escalation Resolution
CEO resolves:
•	naming disputes
•	sensitive historical content
•	controversial entities
•	legal questions
•	cross city conflicts

### 3.2 Object Actions
CEO may:
•	approve
•	hide
•	override City Admin decisions
•	request additional metadata
•	request additional 360° media

### 3.3 Safety Enforcement
CEO ensures:
•	no harmful content
•	no defamatory content
•	no minors without metadata
•	no unsafe ingestion sources


## 4. Brand & Theme Publishing
CEO:
•	reviews drafts
•	approves changes
•	publishes brand settings
•	publishes themes
•	logs all actions

## 5. Editorial Oversight
CEO:
•	resolves editorial disputes
•	handles escalated stories
•	approves unpublishable decisions
•	ensures editorial integrity

## 6. Budget & Payout Governance
CEO:
•   approves payout_batches
•   resolves payout disputes
•   enforces budget compliance
•   manages sponsor escalations

### 6.1 Sponsorship Campaign Governance
CEO is the final authority for all sponsorship lifecycle decisions:
•   reviews sponsor_profiles submitted for brand safety approval
•   sets brand_safety_status ('approved' | 'rejected' | 'suspended') on sponsor_profiles
•   sets good_standing_status on sponsor_profiles (revoke/restore)
•   activates campaigns via rpc_activate_campaign after brand safety approval
•   terminates active campaigns via rpc_expire_campaign with documented reason
•   resolves cross-city campaign disputes
•   may override City Admin sponsorship decisions
City Admins may not activate campaigns directly (RPC enforces CEO-only activation gate).

### 6.2 Brand Safety Enforcement
Brand safety status gates all campaign activation. The CEO enforces:
•   brand_safety_status must be 'approved' before any campaign may go active
•   good_standing_status = false blocks all campaign activation for that sponsor
•   suspension (brand_safety_status = 'suspended') immediately disables all active campaigns
  via rpc_expire_campaign batch call — City Admin is notified
•   All brand safety decisions are written to admin_action_logs (domain = sponsorship)
  with action = brand_safety_approved / brand_safety_rejected / brand_safety_suspended

### 6.3 Sponsor Escalation Workflow
City Admins escalate sponsor disputes to the CEO when:
•   a sponsor violates content standards in a creative asset
•   a campaign targets content inconsistent with its placement contract
•   a sponsor disputes a charge or payout
CEO resolves via the Sponsorship Console (§8).


## 7. Global Settings & Safety
CEO controls:
•	global_feature_toggles
•	global_brand_settings
•	global_safety_settings
•	platform_settings
•	roles & permissions

## 8. Tools & UI Modules
CEO uses:
•	CEO Dashboard
•	Open Admin Requests
•	Theme Publisher
•	Brand Publisher
•	Global Settings
•	Audit Log
•	Safety Console
•   	Sponsorship Console — campaign lifecycle, brand safety, creative asset review
•   	Search Admin — city search index management, ranking weights, reindex controls
•   	Immersive Media Console — cross-city panorama and hotspot management

## 9. Lifecycle
All CEO actions are logged in:
•	admin_action_logs
---

## 10. Brand/Theme Draft Workflow

### 10.1 Purpose
This section expands on §4. It defines the steps the CEO follows to review, approve, and
publish brand and theme drafts submitted by City Admins.

### 10.2 Draft/Publish Model
Electrum maintains two rows per city in city_brand_settings and city_design_system: one
with status = draft and one with status = published. City Admins edit the draft row. The
CEO publishes by copying draft → published (DATA_MODEL.md §11). The public UI always loads
the published row; preview mode loads the draft row.

### 10.3 CEO Review Steps
1. CEO receives notification that a City Admin has submitted a draft for review.
2. CEO opens the draft in preview mode (city_brand_settings.status = draft and
   city_design_system.status = draft).
3. CEO reviews brand identity, design tokens, and page layout for consistency with global
   standards.
4. CEO either:
   a. Publishes the draft — executes the publish action (§10.4), or
   b. Returns the draft with notes — City Admin returns to editing.

### 10.4 Publish Action
Publishing is executed by the CEO only. The system copies draft → published atomically:

```sql
INSERT INTO city_brand_settings (city_id, status, ...)
SELECT city_id, 'published', ...
FROM city_brand_settings
WHERE city_id = $1 AND status = 'draft';


### 10.5 CEO Restrictions

The CEO does not have editorial publication authority.
Only City Admins may set review_status = published or revert it to approved.

However, the CEO does have administrative visibility authority:

freeze/unfreeze stories

hide/unhide stories

emergency unpublish (administrative)

override City Admin visibility decisions

enforce safety holds

resolve escalations

remove harmful content

Administrative unpublish does not modify editorial fields (review_status, published_at, published_by) and does not affect production_units or payout workflows.

CEO administrative publish/unpublish affects only visibility fields (is_hidden, is_frozen, is_published) and does not modify editorial fields (review_status, published_at, published_by) or production/payout objects. CEO administrative story actions are logged to admin_action_logs (domain = editorial, entity_type = civic_stories) as story_admin_frozen, story_admin_unfrozen, story_admin_unpublished, and story_admin_republished. story_published and story_unpublished remain City Admin editorial actions.

All CEO administrative actions are logged in admin_action_logs.

CEO may NOT publish a story (editorial domain; review_status = published is set only by
City Admin per EDITORIAL_WORKFLOW.md §2.2 and PUBLICATION_AND_PAYOUT.md §2).

### 10.6 Global Brand Settings
CEO may also publish global_brand_settings and global_feature_toggles. These apply
platform-wide and are not city-scoped. All changes are written to both admin_action_logs
and security_audit_log (see §11).

### 10.7 Audit
All brand and theme publish actions are written to admin_action_logs (domain = brand) and
security_audit_log (action = theme_published or brand_published). See §11.

---

## 11. Audit Logs

### 11.1 Purpose
This section defines which logging tables the CEO interacts with and what the CEO can
access via the Audit Log UI module (§8).

### 11.2 Logging Tables
CEO actions are written to two tables (DATA_MODEL.md §10):

| Table               | Purpose                                                                              |
|---------------------|--------------------------------------------------------------------------------------|
| admin_action_logs   | All CEO operational actions (non-security). Also receives all City Admin actions.    |
| security_audit_log | Security-critical infrastructure events only: authentication events, role changes,   |
|                     | permission changes, global settings changes, platform-level safety changes.          |

The CEO has full SELECT access to both tables across all cities. The Audit Log UI module
presents a cross-city, cross-domain audit trail.

### 11.3 What Is Logged for the CEO

| Field           | Value                                                                    |
|-----------------|--------------------------------------------------------------------------|
| actor_admin_id  | CEO's admin_users.id                                                     |
| actor_role      | ceo                                                                      |
| action          | Canonical action string (see §11.5)                                      |
| domain          | civic / editorial / payout / brand / ingestion / safety / global / sponsorship / search / navigation |
| entity_type     | PostgreSQL table name of the affected record                             |
| entity_id       | UUID of the affected record                                              |
| metadata        | Structured context (batch totals, override reason, city affected)        |
| created_at      | UTC timestamp                                                            |

### 11.4 Immutability
Audit log entries are immutable. The CEO may not UPDATE or DELETE entries in either
table. The Audit Log UI module is read-only.

### 11.5 Covered Actions — CEO

All CEO operational actions are written to admin_action_logs.
A subset of CEO actions are additionally written to security_audit_log when they
constitute a security-critical infrastructure event (role changes, permission changes,
global settings changes, platform-level safety changes).

admin_action_logs — CEO Operational Actions:

| Domain          | Actions Logged                                                                         |
|-----------------|----------------------------------------------------------------------------------------|
| Civic           | object_approved, object_hidden, object_frozen, object_unfrozen, object_overridden,     |
|                 | escalation_resolved, metadata_requested, media_360_requested                          |
| Editorial       | editorial_dispute_resolved, unpublishable_approved, story_escalation_handled,          |
|                 | story_admin_frozen, story_admin_unfrozen, story_admin_unpublished,                     |
|                 | story_admin_republished (administrative visibility only; entity_type = civic_stories)  |
| Contributors    | contributor_soft_deleted (entity_type = contributor)                                   |
| Payout          | payout_batch_authorized, payout_batch_rejected, payout_dispute_resolved                |
| Brand / Theme   | brand_published, theme_published, draft_returned_with_notes, global_brand_updated      |
| Ingestion       | naming_dispute_resolved, ingestion_source_blocked, sensitive_content_resolved          |
| Safety          | harmful_content_removed, safety_hold_placed, safety_hold_lifted,                       |
|                 | safety_enforcement_action                                                              |
| Global          | global_feature_toggle_updated, global_safety_setting_updated,                          |
|                 | platform_setting_updated, role_assigned, role_revoked                                  |
| Sponsorship     | campaign_created, campaign_activated, campaign_expired, campaign_terminated,           |
|                 | placement_created, placement_activated, placement_deactivated, placement_deleted,       |
|                 | creative_asset_uploaded, creative_asset_deleted, sponsor_validated,                    |
|                 | sponsor_profile_created, sponsor_profile_updated, brand_safety_approved,               |
|                 | brand_safety_rejected, brand_safety_suspended, good_standing_revoked,                  |
|                 | good_standing_restored                                                                 |
| Search          | search_index_rebuilt, search_index_entity_reindexed, search_config_updated             |
| Navigation      | panorama_created, panorama_published, panorama_unpublished, panorama_archived,         |
|                 | panorama_reordered, panorama_metadata_edited, hotspot_placed, hotspot_updated,         |
|                 | hotspot_activated, hotspot_deactivated, hotspot_deleted                                |


security_audit_log — CEO Security-Critical Actions (written in addition to admin_action_logs):

| Event                      | Trigger                                                              |
|----------------------------|----------------------------------------------------------------------|
| login                      | Successful CEO session start                                         |
| logout                     | CEO session end                                                      |
| login_failed               | Failed authentication attempt                                        |
| password_changed           | CEO credential update                                                |
| mfa_event                  | MFA challenge issued or passed                                       |
| role_assigned              | CEO assigns a role to any admin user                                 |
| role_revoked               | CEO revokes a role from any admin user                               |
| permission_changed         | CEO modifies a permission set for any role                           |
| global_setting_updated     | CEO changes any global_feature_toggles or platform_settings record  |
| platform_safety_changed    | CEO changes global_safety_settings                                   |

Note: Operational actions (brand_published, theme_published, payout_batch_authorized,
object_approved, escalation_resolved, etc.) are NOT written to security_audit_log —
they are operational events, not security-critical infrastructure events.

---

## 12. Sponsorship Governance

### 12.1 Purpose
This section expands on §6.1–6.3. It defines the full CEO workflow for reviewing sponsors,
enforcing brand safety, activating campaigns, and resolving sponsorship escalations.
For schema detail, see DATA_MODEL.md §3 (sponsor_profiles, sponsorship_campaigns,
sponsorship_placements, creative_assets) and DATA_MODEL.md §15 (triggers and RPCs).

### 12.2 Sponsor Onboarding & Brand Safety Review

When a new sponsor is created (sponsors INSERT), a sponsor_profiles row is auto-created
by trigger with brand_safety_status = 'pending' and good_standing_status = true.

CEO review steps:
1. CEO receives notification of a new sponsor_profile in 'pending' status.
2. CEO opens the Sponsorship Console → Sponsor Profiles tab.
3. CEO reviews:
   - organization_name and contact_email
   - metadata (contract reference, account manager)
   - any submitted creative assets (creative_assets for draft campaigns)
4. CEO sets brand_safety_status:
   - 'approved'  → sponsor may proceed to campaign creation and activation
   - 'rejected'  → sponsor may not create active campaigns; City Admins notified
   - 'suspended' → all active campaigns immediately expired (batch rpc_expire_campaign);
                   sponsor blocked from new campaign activation until restored
5. All decisions are written to admin_action_logs (domain = sponsorship).

### 12.3 Campaign Activation Gate

Campaign activation is a CEO-only action executed via rpc_activate_campaign.
City Admins may create campaigns (status = 'draft') but cannot activate them.

Activation preconditions enforced by rpc_activate_campaign and
trg_validate_sponsor_on_activate:
- sponsorship_campaigns.status must be 'draft'
- sponsor_profiles.brand_safety_status = 'approved'
- sponsor_profiles.good_standing_status = true
- start_date ≤ CURRENT_DATE ≤ end_date

If any precondition fails, the RPC returns { success: false, reason: '...' } and
no status change occurs.

### 12.4 Campaign Termination

CEO terminates active campaigns via:
- rpc_expire_campaign(campaign_id) — sets status = 'expired' for a single campaign
- Batch termination (suspension) — called automatically when good_standing_status → false
  or brand_safety_status → 'suspended' via trg_expire_placements

Termination is terminal. A terminated campaign cannot be reactivated. A new campaign
must be created.

### 12.5 Cross-City Sponsorship

City Admins may only create campaigns scoped to their own city_id. Cross-city campaigns
(a single campaign spanning multiple cities) require CEO creation:
1. CEO creates the parent campaign with the appropriate city_id.
2. CEO creates placement rows for each additional city.
The city_id field on sponsorship_placements is enforced to match the parent campaign
city_id by trigger (trg_sync_campaign_city_to_placements) — cross-city placement
requires CEO use of the service-role client.

### 12.6 Creative Asset Review

CEO may review all creative_assets for any campaign. If a creative asset violates brand
safety standards:
1. CEO deletes the offending asset (creative_asset_deleted, admin_action_logs).
2. CEO notifies the sponsor (out-of-band; no in-platform messaging in v1).
3. If the violation is severe, CEO suspends the sponsor_profile.

### 12.7 Audit
All sponsorship governance actions are written to admin_action_logs (domain = sponsorship).
No sponsorship action is written to security_audit_log (sponsorship is an operational
domain, not a security-critical infrastructure domain).

---

## 13. Search Governance

### 13.1 Purpose
This section defines CEO responsibilities for the Electrum search subsystem. City Admins
manage search configuration for their own cities; the CEO manages cross-city search
governance, global ranking policy, and index integrity. For schema detail, see
SEARCH_MODEL.md and DATA_MODEL.md §3 (search_index).

### 13.2 CEO Search Permissions

| Action | City Admin | CEO |
|---|---|---|
| Trigger rpc_reindex_city for own city | ✅ | ✅ |
| Trigger rpc_reindex_city for any city | ❌ | ✅ |
| Trigger rpc_reindex_entity for any entity | ❌ | ✅ |
| View search_index rows (published only) | ✅ | ✅ |
| View search_index rows (all, including unpublished) | ❌ | ✅ |
| Update search ranking weights (city_prompts) | Own city | All cities |
| Update search stop words (city_prompts) | Own city | All cities |
| Inspect search audit log | Own city | All cities |

### 13.3 Cross-City Search Oversight

In v1, search is city-scoped. The CEO is responsible for:
- ensuring that search_index rows do not leak private or safety-held content
  (enforced by is_published = false on ineligible rows; CEO audits periodically)
- approving any configuration changes to enable multi-city search (future; §9.4
  of SEARCH_MODEL.md) — this requires a platform_setting_updated entry in
  security_audit_log as it is a platform-level capability change
- resolving escalations where a civic object appears in an incorrect city's search index

### 13.4 Search Sponsorship Independence

The CEO is the ultimate enforcer of the search sponsorship boundary defined in
SEARCH_MODEL.md §7. No configuration, feature flag, or City Admin action may introduce
sponsorship data into search results. Any proposal to modify this boundary requires:
1. A documented revision to SEARCH_MODEL.md §7.
2. CEO written approval recorded in admin_action_logs
   (action = search_config_updated, metadata.change = 'sponsorship_boundary_modified').
3. A new migration reviewed by the CEO before deployment.

### 13.5 Index Integrity Monitoring

The CEO uses the Search Admin tool to:
- view the total indexed row count per city and entity type
- identify stale rows (is_published = true for records that are no longer eligible)
- trigger manual reindex for any city via rpc_reindex_city
- review search_config_updated entries in admin_action_logs across all cities

### 13.6 Audit
All CEO search governance actions are written to admin_action_logs (domain = search).
The search domain is operational, not security-critical; no search action is written
to security_audit_log.

