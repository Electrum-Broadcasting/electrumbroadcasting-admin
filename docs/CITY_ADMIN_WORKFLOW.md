# CITY_ADMIN_WORKFLOW.md

*Compatibility: DATA_MODEL.md · PANORAMA_MODEL.md · HOTSPOT_MODEL.md · HOTSPOT_WORKFLOW.md · OBJECT_PAGE_MODEL.md · STORY_PAGE_MODEL.md · EDITORIAL_WORKFLOW.md · PUBLICATION_AND_PAYOUT.md · RATE_CARD.md · THEME_SCHEMA.md*
*Last updated: 2026-10-09*

---

## 1. Purpose & Scope

Defines the responsibilities, permissions, and workflows for City Admins across all Electrum domains:
- civic object curation
- ingestion review
- editorial coordination
- **immersive media curation (panoramas and hotspots)** ← new
- budget management
- sponsor allocations
- payouts
- brand & theme management
- safety & governance actions

City Admins are the operational stewards of each city.

---

## 2. Role Definition

### 2.1 Permissions

City Admins may:
- SELECT/UPDATE civic_* tables for their city
- SELECT sponsor_allocations
- SELECT production_units
- INSERT payout_batch_items
- UPDATE city_brand_settings (draft)
- UPDATE city_design_system (draft)
- Approve/hide civic objects
- Upload 360° media
- Accept AI suggestions
- Escalate objects to CEO
- Transition production_units → city_published
- **INSERT/UPDATE/DELETE panoramas for their city** ← new
- **INSERT/UPDATE/DELETE hotspots for their city** ← new
- **Publish and archive panoramas** ← new
- **Activate and deactivate hotspots** ← new
- **Configure Object Page and Story Page settings** ← new

### 2.2 Restrictions

City Admins may NOT:
- publish themes
- publish brand settings
- finalize payouts
- override CEO decisions
- modify global settings
- access raw_ingestion
- **link a hotspot to a target record (civic object, story, or panorama) belonging to a different city** ← new
- **hard-delete a hotspot more than 24 hours after its creation** (deactivation required instead; hard deletion after 24 h is CEO-only) ← new
- **re-publish an archived panorama** (a new panorama row must be created instead) ← new

---

## 3. Civic Object Workflow

### 3.1 Ingestion Review

City Admins review:
- pending civic objects
- AI suggestions
- merge candidates
- missing 360° media
- ingestion anomalies

### 3.2 Object Actions

City Admins may:
- approve
- hide
- edit metadata
- upload hero_360_url
- merge duplicates
- accept/reject suggestions
- escalate to CEO
- **upload panoramas and manage the panorama carousel for each civic object** ← new
- **place, configure, activate, and deactivate hotspots within published panoramas** ← new
- **configure Object Page settings (section visibility, SEO overrides, VR/AR flags)** ← new

### 3.3 Publication

Objects become public when:
- `status = approved`
- `is_published = true`
- `hero_360_url IS NOT NULL`

> **Note — hero_360_url and panoramas:** When a City Admin publishes a panorama with `display_order = 0` for a civic object, `hero_360_url` on the parent civic object is automatically updated to match the panorama's `equirectangular_url` (via trigger). City Admins do not need to set `hero_360_url` manually for objects that have a primary published panorama. See PANORAMA_MODEL.md §10.1.

---

## 4. Editorial Workflow Integration

City Admins:
- publish editor-approved stories
- production_units are created automatically by the system at publication time
- transition production_units → city_published
- trigger payouts
- production_units are created automatically at publication time with the content_tier selected by the City Admin
- **configure Story Page settings for published stories (section visibility, inline 360° captions, SEO overrides, VR/AR flags)** ← new

---

## 5. Budget & Sponsor Workflow

City Admins:
- view city_budget
- view sponsor_allocations
- track production_unit costs
- manage payout_batch_items
- ensure budget compliance

---

## 6. Brand & Theme Workflow

City Admins:
- edit brand settings (draft)
- edit design system (draft)
- submit drafts for CEO review
- cannot publish

---

## 7. Safety & Governance

City Admins:
- flag problematic content
- escalate sensitive objects
- enforce city level safety settings

---

## 8. Tools & UI Modules

City Admins use:
- Object Manager
- **Panorama Manager** (tab within Object Manager) ← new
- **Hotspot Editor** (sub-tool within Panorama Manager) ← new
- Publication Queue
- Production Units
- Budget Dashboard
- Sponsor Allocations
- Brand Settings
- Theme Editor
- Audit Log

---

## 9. Lifecycle

City Admin actions are logged in:
- admin_action_logs

---

## 10. Object Manager

### 10.1 Purpose

The Object Manager is the City Admin's primary interface for curating civic objects within their city. It surfaces all civic content tables (civic_entities, civic_events, civic_places, civic_moments, civic_artifacts, civic_neighborhoods) in a unified review queue.

### 10.2 Responsibilities

City Admins use the Object Manager to:
- Review pending civic objects produced by ingestion workers or manual submission.
- Accept or reject AI suggestions via `rpc_apply_suggestion`.
- Edit metadata fields (title, description, slug, tags, media URLs) on any civic object scoped to their city.
- Upload `hero_360_url` assets and bind them to civic objects.
- Merge duplicate civic objects identified during ingestion review.
- Approve objects (`status = approved`, `is_published = true`) to make them visible on the public UI.
- Hide objects (`is_published = false`) to remove them from the public UI without deletion.
- Escalate disputed or sensitive objects to the CEO.
- **Manage panoramas via the Panoramas tab (§10.6).** ← new
- **Configure Object Page settings via the Page Settings tab (OBJECT_PAGE_MODEL.md §8).** ← new

### 10.3 Scope Boundary

- City Admins may only act on objects where `city_id` matches their assigned city.
- City Admins may NOT access `raw_ingestion` directly; ingestion review is limited to normalized civic objects and `civic_object_suggestions`.
- Object deletion is not permitted; City Admins may only hide (`is_published = false`) or escalate.

### 10.4 Object Approval Gate

A civic object is eligible for public display only when all of the following are true:
1. `status = approved`
2. `is_published = true`
3. `hero_360_url IS NOT NULL` (where 360° media is required by city configuration)

> Once the object has at least one published panorama, `hero_360_url` is maintained automatically. The gate remains unchanged; the auto-population trigger satisfies it without City Admin intervention.

### 10.5 Audit

All Object Manager actions (approve, hide, merge, escalate, metadata edit) are written to `admin_action_logs` with `entity_type` and `entity_id` populated. See §14.

---

### 10.6 Panoramas Tab

#### 10.6.1 Purpose

The **Panoramas tab** is available on any civic object with `status = approved`. It is the City Admin's interface for uploading, reviewing, and publishing 360° media assets for that object. For full schema detail, see **PANORAMA_MODEL.md**.

#### 10.6.2 Access path

```
Object Manager → [Approved civic object] → Panoramas tab
```

#### 10.6.3 Panorama list

The Panoramas tab displays all panoramas for the object in a list ordered by `display_order`, with status badges (Draft / Published / Archived) and thumbnail previews.

#### 10.6.4 City Admin actions on panoramas

| Action | Permitted | Notes |
|---|---|---|
| Upload new panorama | ✅ | JPG/PNG ≤ 50 MB, 2:1 ratio; MP4 ≤ 2 GB for video |
| Edit label, description, capture attribution | ✅ | |
| Set initial camera heading (`pan_x_initial`, `pan_y_initial`) | ✅ | Via "Set Initial View" in the preview viewer |
| Set display order | ✅ | Drag-and-drop reorder |
| Set VR comfort level | ✅ | seated / standing / room_scale in `metadata` |
| Upload ambient audio | ✅ | Stored in `metadata.ambient_audio_url` |
| Publish (`status → published`) | ✅ | Hotspot Editor tab becomes available after publish |
| Unpublish (`status → draft`) | ✅ | Hides panorama and all its hotspots from public |
| Archive (`status → archived`) | ✅ | Irreversible; cascades deactivation of all hotspots |
| Re-publish archived panorama | ❌ | Create a new panorama instead |
| Delete a panorama row | ❌ | Archive only; hard deletion is CEO-only |

#### 10.6.5 Primary panorama

The published panorama with the lowest `display_order` is the **primary panorama**. It is the panorama loaded by default on the Object Page and the source of the auto-populated `hero_360_url`. City Admin controls primary panorama by reordering the list.

#### 10.6.6 Audit

All panorama actions are written to `admin_action_logs` with `domain = navigation`. See §14.5.

---

### 10.7 Hotspot Editor

#### 10.7.1 Purpose

The **Hotspot Editor** is a sub-tool within the Panoramas tab. It allows City Admins to place interactive markers (hotspots) inside a published panorama and link them to civic objects, stories, other panoramas, or external URLs. For full schema and coordinate system detail, see **HOTSPOT_MODEL.md**. For the full step-by-step placement workflow, see **HOTSPOT_WORKFLOW.md**.

#### 10.7.2 Access path

```
Object Manager → [Approved civic object] → Panoramas tab
  → [Published panorama] → Hotspot Editor tab
```

The Hotspot Editor tab is disabled on draft and archived panoramas. Tooltip: *"Publish this panorama to place hotspots."*

#### 10.7.3 Coordinate system

Hotspot positions are stored as **normalized UV coordinates** (`pan_x`, `pan_y`), each in the range `0.0–1.0`:
- `pan_x`: horizontal position — `0.0` = left edge, `1.0` = right edge, `0.5` = centre
- `pan_y`: vertical position — `0.0` = top (zenith), `1.0` = bottom (nadir), `0.5` = horizon

City Admin places a hotspot by clicking anywhere in the 360° viewer. The viewer captures `(pan_x, pan_y)` from the pointer position. See HOTSPOT_MODEL.md §2 for conversion formulas used by the viewer layer.

#### 10.7.4 City Admin actions on hotspots

| Action | Permitted | Notes |
|---|---|---|
| Place hotspot (click in viewer) | ✅ | Saved as inactive by default |
| Edit label, icon, target, metadata | ✅ | |
| Adjust position (drag or numeric input) | ✅ | |
| Activate hotspot | ✅ | `rpc_validate_hotspot_target` runs before activation |
| Deactivate hotspot | ✅ | Hides from public; preserves row |
| Bulk activate / deactivate | ✅ | |
| Reorder hotspots (`display_order`) | ✅ | Drag-and-drop in Hotspot List Panel |
| Hard-delete hotspot within 24 h of creation | ✅ | Requires confirmation dialog + reason |
| Hard-delete hotspot after 24 h | ❌ | Deactivate instead; CEO-only after 24 h |
| Link to target in another city | ❌ | CEO-only |
| Edit `behavior.world_position` directly | ❌ | Computed by viewer layer; readable in VR Preview |

#### 10.7.5 Target eligibility

| target_type | Requirement |
|---|---|
| civic_entity / event / place / moment / artifact / neighborhood | `is_published = true` |
| civic_story | `review_status = 'published'` |
| panorama | `status = 'published'`; must be in same city |
| external_url | Valid `https://` URL |

Validated by `rpc_validate_hotspot_target` before the Save button is enabled and again before activation.

#### 10.7.6 Navigation hotspots (panorama → panorama)

When `target_type = 'panorama'`, the hotspot enables panorama-to-panorama navigation — the user moves from the current panorama to the destination without a page reload. After saving, the admin UI prompts City Admin to create a reciprocal return hotspot on the destination panorama (advisory; dismissible).

#### 10.7.7 Stale hotspots

The Hotspot List Panel shows an amber **Stale** badge on any active hotspot whose target no longer passes `rpc_validate_hotspot_target` (e.g., a linked civic object was subsequently hidden). Stale hotspots remain visible to the public viewer until deactivated. City Admin should investigate and deactivate or retarget them.

#### 10.7.8 Audit

All hotspot actions are written to `admin_action_logs` with `domain = navigation`. See §14.5.

---

## 11. Publication Queue

### 11.1 Purpose

The Publication Queue is the City Admin's view of all `civic_stories` with `review_status = approved` that are pending publication. It is the handoff surface from the editorial workflow to the publication action.

### 11.2 Queue Behaviour

- Stories enter the queue when an Editor sets `review_status = approved` (EDITORIAL_WORKFLOW.md §7).
- The queue is ordered by `reviewed_at` ascending (oldest approval first).
- City Admins may filter by tier, contributor, or `reviewed_at` range.
- Stories remain in the queue until published or placed on a safety hold.

### 11.3 Pre-Publication Checklist

Before executing the publish action, City Admin confirms:
- [ ] `review_status = approved`
- [ ] `reviewed_at` is populated
- [ ] `review_notes` is non-empty
- [ ] `revision_requested = false`
- [ ] No active legal or safety hold on the story
- [ ] `city_budget` has sufficient `remaining_cents` to cover `net_city_cost`
- [ ] Any `sponsor_allocations` attached to the story are active
- [ ] Content tier has been selected (required for `production_unit` creation)
- [ ] `safety_hold = false`

### 11.4 Publish Action

City Admin executes publish. The system performs the following atomically (PUBLICATION_AND_PAYOUT.md §3.2):

1. Sets `review_status = published`
2. Sets `published_at` and `published_by`
3. City Admin selects `content_tier` (`'standard' | 'feature' | 'investigation'`) before executing publish. This tier is persisted to `production_units.content_tier` and logged as `tier_selected`.
4. Creates a `production_unit`
5. Debits `city_budget` by `production_unit.net_city_cost`
6. Applies `sponsor_credit` if a matching active `sponsor_allocation` exists
7. Creates `payout_batch_item` candidates
8. Emits a `story.published` event
9. **Creates a `story_page_settings` row with all defaults** (via trigger; STORY_PAGE_MODEL.md §5.1) ← new

### 11.5 Unpublish Action

City Admin may unpublish a live story:
- `review_status` reverts to `approved`; story re-enters the Publication Queue
- `production_unit` remains intact; `city_budget` debit is not reversed
- If `payout_batch_item` is still pending, City Admin may remove it with a required note
- If `payout_batch` has already been authorized by the CEO, payout cannot be reversed

### 11.6 Story Page Settings

After a story is published, City Admin may configure Story Page display behaviour via the **Page Settings tab** in the Publication Queue:

```
Publication Queue → [Published story] → Page Settings tab
```

Available controls: section visibility toggles, inline 360° embed captions, SEO title and meta description overrides, custom OG image, VR button enable/disable. See STORY_PAGE_MODEL.md §10.

### 11.7 Audit

All publication and unpublish actions are written to `admin_action_logs` with `domain = editorial` and `entity_type = civic_stories`. See §14.

---

## 12. Brand/Theme Draft Workflow

### 12.1 Purpose

This section expands on §6. It defines the detailed steps City Admins follow to edit, preview, and submit brand and theme drafts for CEO review and publication.

### 12.2 Editable Objects

City Admins may edit the following in draft mode:
- `city_brand_settings` (`status = draft`): `homepage_tagline`, `homepage_subtitle`, `hero_title`, `hero_subtitle`, `hero_cta_text`, `hero_cta_link`, social links, logo, accessibility, `child_safety`, `slideshow_asset_ids`, pages.
- `city_design_system` (`status = draft`): `draft_theme` JSON (colors, typography per THEME_SCHEMA.md).

City Admins may NOT modify:
- published rows in `city_brand_settings` or `city_design_system`
- `global_brand_settings`
- Any deprecated theme key listed in THEME_SCHEMA.md §5

### 12.3 Draft/Publish Model

Electrum maintains two rows per city in `city_brand_settings` and `city_design_system`: one with `status = draft` and one with `status = published`. City Admins write to draft rows only. Preview mode loads draft; the public UI loads published (DATA_MODEL.md §11).

### 12.4 Submission for CEO Review

1. City Admin completes edits to draft row(s).
2. City Admin marks the draft as ready for review (admin UI action; no schema field change).
3. CEO is notified of the pending draft submission.
4. CEO reviews the draft in preview mode.
5. CEO publishes (copies draft → published row) or returns with notes.

### 12.5 City Admin Restrictions

- City Admins cannot execute the publish action on brand or design system rows.
- City Admins cannot modify the published row directly.
- City Admins cannot modify deprecated theme keys listed in THEME_SCHEMA.md §5.

### 12.6 Audit

All draft edits to `city_brand_settings` and `city_design_system` are written to `admin_action_logs` with `domain = brand`. See §14.

---

## 13. Safety

### 13.1 Purpose

This section expands on §7. It defines the specific safety and governance actions available to City Admins within their city scope.

### 13.2 Content Flagging

City Admins may flag any civic object or `civic_story` for safety review:
- Sets `flag_reason` on the relevant record.
- Optionally sets `is_published = false` to remove the content from public view immediately.
- Writes an entry to `admin_action_logs` with `action = content_flagged`.

City Admins may NOT:
- Modify `global_safety_settings` (CEO only).
- Hard-delete any content record.
- Override a CEO safety ruling.

### 13.3 Escalation to CEO

City Admins must escalate to the CEO when:
- Content involves potential legal liability (litigation, defamation, IP disputes).
- Content involves a protected individual (minor identification, location of at-risk person).
- Content conflicts with another city's published civic record.
- City Admin cannot resolve the matter within their city scope.

Escalation is recorded in `admin_action_logs` with `action = escalated_to_ceo` and `entity_id` of the affected object.

### 13.4 Safety Hold on Stories

A City Admin may place a safety hold on a `civic_story` pending editorial or legal review:
- Story cannot be published while a hold is active (PUBLICATION_AND_PAYOUT.md §3.1, precondition 4).
- Hold is recorded in `admin_action_logs`.
- City Admins may set `safety_hold = true` with `safety_hold_notes` to block publication pending review.
- City Admins and the CEO may lift safety holds.
- Editors may not modify `safety_hold`.

### 13.5 Hotspot Safety

City Admins may deactivate (`is_active = false`) any hotspot in their city at any time without CEO authorization. If a hotspot links to content that has been flagged or placed on a safety hold, City Admin should deactivate the hotspot immediately to prevent the public viewer from surfacing the link.

A hotspot pointing to a civic object that is subsequently hidden (`is_published = false`) does not auto-deactivate — the **Stale Hotspots** warning (§10.7.7) surfaces these for City Admin attention.

### 13.6 city_safety_settings

City Admins may VIEW `city_safety_settings` for their city. Modification requires CEO authorization. Changes are logged in `admin_action_logs` and `security_audit_log`.

### 13.7 Audit

All safety actions (flag, hold, escalate, hide) are written to `admin_action_logs`. Safety-critical actions (hold placement, hold removal) are additionally written to `security_audit_log`. See §14.

---

## 14. Audit Logs

### 14.1 Purpose

This section defines which logging tables City Admins interact with, what is logged on their behalf, and what City Admins can view in the Audit Log UI module (§8).

### 14.2 Logging Tables

City Admin actions are written to `admin_action_logs` (DATA_MODEL.md §10).

| Table | Purpose |
|---|---|
| `admin_action_logs` | All City Admin operational actions — and all CEO non-security actions. |
| `security_audit_log` | Security-critical infrastructure events only: authentication events, role changes, permission changes, global settings changes, platform safety changes. City Admin actions are NOT written here. |

City Admins may view `admin_action_logs` entries scoped to their `city_id` via the Audit Log UI module. City Admins may NOT view `security_audit_log` (CEO only).

### 14.3 What Is Logged for City Admins

| Field | Value |
|---|---|
| `actor_admin_id` | City Admin's `admin_users.id` |
| `actor_role` | `city_admin` |
| `action` | Canonical action string (see §14.5) |
| `domain` | editorial / civic / budget / brand / sponsor / safety / navigation |
| `entity_type` | PostgreSQL table name of the affected record |
| `entity_id` | UUID of the affected record |
| `metadata` | Structured diff or context (old/new values, notes, tier selected) |
| `created_at` | UTC timestamp |

### 14.4 Immutability

Audit log entries are immutable. City Admins may not UPDATE or DELETE entries in `admin_action_logs`. The Audit Log UI module is read-only.

### 14.5 Covered Actions — City Admin

All City Admin actions are written exclusively to `admin_action_logs`. No City Admin action is written to `security_audit_log`.

| Domain | Actions Logged |
|---|---|
| Editorial | `story_published`, `story_unpublished`, `production_unit_created`, `tier_selected`, **`story_page_settings_edited`** |
| Civic | `object_approved`, `object_hidden`, `object_merged`, `object_escalated`, `metadata_edited`, `media_uploaded`, `suggestion_accepted`, `suggestion_rejected`, **`page_settings_edited`** |
| Budget | `payout_batch_created`, `payout_batch_item_added`, `payout_batch_item_removed` |
| Sponsor | `sponsor_credit_applied` |
| Brand | `brand_draft_edited`, `design_draft_edited`, `draft_submitted_for_review` |
| Safety | `content_flagged`, `safety_hold_placed`, `safety_hold_lifted`, `escalated_to_ceo` |
| Navigation | `navigation_item_created`, `navigation_item_updated`, `navigation_item_deleted`, **`panorama_created`**, **`panorama_published`**, **`panorama_unpublished`**, **`panorama_archived`**, **`panorama_reordered`**, **`panorama_metadata_edited`**, **`hotspot_placed`**, **`hotspot_updated`**, **`hotspot_activated`**, **`hotspot_deactivated`**, **`hotspot_deleted`** |

New action strings are in **bold**. All new actions are written to `admin_action_logs` only, never to `security_audit_log`.

---

## 15. Navigation

### 15.1 Purpose

This section defines City Admin responsibilities for `city_navigation`, the table that governs the public navigation structure for each city.

### 15.2 city_navigation Table

`city_navigation` (DATA_MODEL.md §2) is active but lightly used. It stores public navigation links and structure for a city's public UI. City Admins are responsible for keeping navigation entries consistent with published civic content and modular pages.

### 15.3 City Admin Actions

City Admins may:
- SELECT `city_navigation` entries for their city.
- INSERT/UPDATE navigation entries for their city (RLS-scoped by `city_id`).
- Reorder navigation items.
- Link navigation entries to published modular pages (`/pages/[pageSlug]`).
- Link navigation entries to civic content routes (`/events/[eventSlug]`, etc.).

City Admins may NOT:
- Modify navigation for another city.
- Set navigation links that bypass the canonical routing patterns defined in ARCHITECTURE.md §2.

### 15.4 Navigation and Draft/Publish

`city_navigation` does not participate in the draft/publish model used by `city_brand_settings` and `city_design_system`. Navigation changes are live on the public UI immediately upon INSERT/UPDATE.

### 15.5 Audit

All INSERT/UPDATE operations on `city_navigation` are written to `admin_action_logs` with `domain = navigation` and `entity_type = city_navigation`.

---

## 16. Panorama & Hotspot Management

### 16.1 Purpose

This section is the City Admin's complete reference for managing immersive 360° media and hotspot markers. It consolidates the permissions, workflow, tools, and guardrails defined in PANORAMA_MODEL.md and HOTSPOT_WORKFLOW.md into the City Admin context.

For schema definitions and trigger details, see:
- **PANORAMA_MODEL.md** — `panoramas` table, lifecycle, RLS, triggers
- **HOTSPOT_MODEL.md** — `hotspots` table, `pan_x`/`pan_y` coordinate system, `behavior` JSONB, RLS
- **HOTSPOT_WORKFLOW.md** — step-by-step placement, activation, deletion, VR preview

---

### 16.2 Conceptual Model

```
cities (1)
  └── (N) civic_* objects  [Object Manager]
                └── (N) panoramas  [Panoramas tab]
                              └── (N) hotspots  [Hotspot Editor]
                                        │
                          links to civic objects, stories,
                          other panoramas, or external URLs
```

A **panorama** is the 360° rendering surface. A **hotspot** is a spatial marker placed inside a panorama that links outward to the civic graph. Together they form the immersive layer of the Object Page (OBJECT_PAGE_MODEL.md §4.2–4.3).

---

### 16.3 Panorama Lifecycle

| Status | Visible to anon | Hotspot Editor available | Notes |
|---|---|---|---|
| `draft` | No | No | Upload and configure; not live |
| `published` | Yes | Yes | Primary panorama populates `hero_360_url` |
| `archived` | No | No | All hotspots auto-deactivated; irreversible |

**State transitions City Admin may perform:**

```
draft ──────────► published ──────────► archived
  ▲                   │
  └──── unpublish ────┘
        (returns to draft; hotspots preserved but hidden)
```

Re-publishing from archived is not permitted. Create a new panorama row instead.

---

### 16.4 Hotspot Lifecycle

| State | Visible to anon | City Admin may | Notes |
|---|---|---|---|
| Saved (inactive) | No | Edit, activate, delete (within 24 h) | Default state on creation |
| Active | Yes | Deactivate, edit, reorder | Visible in live viewer |
| Deactivated | No | Reactivate, edit, delete (within 24 h of creation) | Row preserved |
| Auto-deactivated | No | Reactivate | Triggered by parent panorama archive |

**Deletion rules:**

| Window | City Admin | CEO |
|---|---|---|
| Within 24 h of `created_at` | Hard delete (with reason) | Hard delete |
| After 24 h | Deactivate only | Hard delete |

---

### 16.5 pan_x / pan_y — What City Admins Need to Know

Hotspot positions use **normalized UV coordinates** — not degrees, not latitude/longitude. The values represent position within the panorama's image plane:

| `pan_x` | `pan_y` | Where in the panorama |
|---|---|---|
| 0.5 | 0.5 | Centre of the image — the horizon directly ahead |
| 0.0 | 0.5 | Far left edge at the horizon |
| 1.0 | 0.5 | Far right edge at the horizon (same as 0.0 — image wraps) |
| 0.5 | 0.0 | Straight up (zenith) |
| 0.5 | 1.0 | Straight down (nadir) |

City Admins never enter these values manually during normal use. The 360° viewer captures them automatically when you click to place a hotspot, or when you drag an existing hotspot to a new position. Manual numeric inputs (4 decimal places) are available as a precision override in the Configuration Panel.

---

### 16.6 End-to-End Workflow Summary

```
1. Approve civic object in Object Manager
        │
        ▼
2. Open Panoramas tab → Upload 360° image or video
        │
        ▼
3. Set label, initial heading (pan_x_initial / pan_y_initial),
   display order, capture attribution
        │
        ▼
4. Publish panorama  →  hero_360_url auto-updated on civic object
                        Hotspot Editor tab becomes available
        │
        ▼
5. Open Hotspot Editor → Click in viewer to place hotspot anchor
        │
        ▼
6. Configure hotspot: label, icon, target type, target record
   System validates target via rpc_validate_hotspot_target
        │
        ▼
7. Save hotspot  →  saved as inactive; visible only in preview
        │
        ▼
8. Preview hotspot in viewer; adjust position if needed
        │
        ▼
9. Activate hotspot  →  immediately visible to anon
        │
        ▼
10. Repeat steps 5–9 for additional hotspots
        │
        ▼
11. (Optional) Add additional panoramas with display_order > 0
    for panorama carousel on Object Page
        │
        ▼
12. Object Page viewer now loads primary panorama with
    active hotspots — immersive experience is live
```

---

### 16.7 Object Page and Story Page Settings

City Admins may configure page-level display options for published civic objects and stories. These settings do not affect the civic object record or the story record directly; they are stored in the `civic_object_page_settings` and `story_page_settings` tables respectively.

**Object Page Settings** (OBJECT_PAGE_MODEL.md §8):

| Setting | Default | Effect |
|---|---|---|
| `show_nearby_map` | true | Shows Nearby Places map section |
| `show_related_stories` | true | Shows Related Stories section |
| `show_media_gallery` | true | Shows Media Gallery section |
| `show_sponsor_bar` | true | Shows Sponsor Attribution section |
| `seo_title` | — | Overrides `<title>` and OG title (max 70 chars) |
| `seo_description` | — | Overrides meta description (max 160 chars) |
| `og_image_url` | — | Overrides OG social share image |
| `enable_vr_button` | true | Shows "Open in VR" in action bar |
| `enable_ar_button` | false | Shows "Open in AR" (gated behind AR launch flag) |

**Story Page Settings** (STORY_PAGE_MODEL.md §10):

| Setting | Default | Effect |
|---|---|---|
| `show_related_stories` | true | Shows Related Stories section |
| `show_sponsor_bar` | true | Shows Sponsor Attribution section |
| `show_production_attribution` | false | Shows editorial transparency note |
| `enable_inline_360` | true | Enables inline 360° embeds in story body |
| `inline_360_captions` | {} | Per-embed captions keyed by array index |
| `seo_title` | — | Overrides `<title>` and OG title (max 70 chars) |
| `seo_description` | — | Overrides meta description (max 160 chars) |
| `og_image_url` | — | Overrides OG social share image |
| `enable_vr_button` | true | Shows "Open in VR" (only when `hero_360_url` present) |
| `enable_ar_button` | false | Shows "Open in AR" (gated behind AR launch flag) |

All page settings changes are written to `admin_action_logs` with `domain = civic` (object pages) or `domain = editorial` (story pages).

---

### 16.8 VR Preview Mode

City Admins can toggle **VR Preview** from within the Hotspot Editor to inspect the panorama and all its hotspots in a WebXR immersive-vr session (requires a compatible headset or browser). In VR Preview:

- Active hotspots render as 3D floating markers.
- Inactive hotspots render in a ghost style (visible to City Admin; not visible to anon).
- The **Advanced (VR)** section of the Configuration Panel becomes available, exposing `behavior` JSONB keys: `linger_ms`, `haptic_preset`, `animation`, `interaction_radius`.
- No analytics events are emitted in preview mode.

---

### 16.9 Restrictions Summary

| Action | City Admin | CEO |
|---|---|---|
| Upload panorama | Own cities | All cities |
| Publish / unpublish panorama | Own cities | All cities |
| Archive panorama | Own cities | All cities |
| Re-publish archived panorama | ❌ | ❌ (new row required) |
| Hard-delete panorama | ❌ | ✅ |
| Place hotspot | Own cities | All cities |
| Activate / deactivate hotspot | Own cities | All cities |
| Hard-delete hotspot (within 24 h) | Own cities | All cities |
| Hard-delete hotspot (after 24 h) | ❌ | ✅ |
| Link hotspot across cities | ❌ | ✅ |
| Edit page settings | Own cities | All cities |
| Set canonical URL on page settings | ❌ (CEO authorization required) | ✅ |

All six documents are complete. Here's the full change summary for `CITY_ADMIN_WORKFLOW.md`:

---

## What Changed in CITY_ADMIN_WORKFLOW.md

Every existing section was preserved verbatim. Additions are integrated inline at the correct structural level.

### Targeted edits to existing sections

| Section | Change |
|---|---|
| §1 Purpose & Scope | Added `immersive media curation (panoramas and hotspots)` to the domain list |
| §2.1 Permissions | Added: INSERT/UPDATE/DELETE panoramas and hotspots; publish/archive panoramas; activate/deactivate hotspots; configure Object Page and Story Page settings |
| §2.2 Restrictions | Added: no cross-city hotspot links; no hard-delete of hotspots after 24 h; no re-publishing archived panoramas |
| §3.2 Object Actions | Added: manage panoramas, place hotspots, configure Object Page settings |
| §3.3 Publication | Added a note explaining that `hero_360_url` is auto-populated from the primary published panorama — no manual sync needed |
| §4 Editorial | Added Story Page settings configuration responsibility |
| §8 Tools | Added Panorama Manager and Hotspot Editor to the tools list |
| §10.2 Object Manager | Added Panoramas tab and Page Settings tab to responsibilities |
| §11.4 Publish Action | Added step 9: `story_page_settings` row auto-created by trigger on publish |
| §13 Safety | Added §13.5 Hotspot Safety — deactivation requirement when linked content is flagged or held |
| §14.5 Covered Actions | Extended Navigation domain with 10 new action strings; added `story_page_settings_edited` and `page_settings_edited` to Editorial and Civic domains |

### New subsections

| Subsection | Content |
|---|---|
| §10.6 Panoramas Tab | Full City Admin reference: access path, action permissions table, primary panorama rules, audit |
| §10.7 Hotspot Editor | Access path, coordinate system plain-language explanation, action permissions table, target eligibility table, navigation hotspot behaviour, stale hotspot warning, audit |
| §11.6 Story Page Settings | Access path and available controls for Story Page configuration post-publication |

### New section

**§16 Panorama & Hotspot Management** — a standalone, self-contained reference that consolidates everything a City Admin needs to know without requiring them to read the schema docs:
- §16.2 Conceptual model diagram
- §16.3 Panorama lifecycle table and state diagram
- §16.4 Hotspot lifecycle table and deletion rules
- §16.5 `pan_x`/`pan_y` plain-language explanation with a position reference table
- §16.6 End-to-end workflow (12-step numbered flow from object approval through live hotspots)
- §16.7 Object Page and Story Page settings reference tables
- §16.8 VR Preview Mode
- §16.9 Restrictions summary table (City Admin vs. CEO for every immersive media action)

---

