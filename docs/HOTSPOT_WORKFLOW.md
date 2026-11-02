HOTSPOT_WORKFLOW.md
Electrum — City Admin Hotspot Management Workflow
Compatibility: DATA_MODEL.md · HOTSPOT_MODEL.md · PANORAMA_MODEL.md · CITY_ADMIN_WORKFLOW.md
Last updated: 2026-10-09

1. Purpose & Scope
This document defines the end-to-end workflow City Admins follow to create, configure, activate, and manage hotspots within 360° panoramas.

For schema details, field definitions, RLS policies, and coordinate system documentation, see HOTSPOT_MODEL.md.
For panorama upload and lifecycle, see PANORAMA_MODEL.md.

This document covers:

Role permissions and access path

Prerequisites and target eligibility rules

rpc_validate_hotspot_target contract

Step-by-step placement procedure and pan_x/pan_y capture

Activation, deactivation, and bulk operations

Reordering

Navigation hotspots (panorama → panorama)

Editing and deletion rules

Audit log entries

UI component requirements

Unity / VR admin considerations

2. Role & Permissions
Action	City Admin	CEO
View hotspots (own city)	✅	✅
Place hotspot (own city)	✅	✅
Edit hotspot (own city)	✅	✅
Activate / deactivate (own city)	✅	✅
Reorder hotspots (own city)	✅	✅
Delete hotspot within 24 h of creation	✅	✅
Delete hotspot after 24 h	❌	✅
View hotspots across all cities	❌	✅
Link hotspot to a target in another city	❌	✅


City Admin scope is enforced by the hotspots_admin RLS policy (HOTSPOT_MODEL.md §8). Every mutation RPC additionally validates city_id server-side before committing.

3. Access Path
Hotspot management is accessed from within the Object Manager (CITY_ADMIN_WORKFLOW.md §10):

Code


Copy
Object Manager
  └── [Select approved civic object]
        └── Panoramas tab
              └── [Select a published panorama]
                    └── Hotspot Editor
The Hotspot Editor tab is available on any panorama with status = 'published'. Draft panoramas display the tab as disabled with the tooltip: "Publish this panorama to place hotspots."

4. Prerequisites
All of the following must be true before a hotspot can be placed or activated.

4.1 Parent panorama
panoramas.status = 'published'

4.2 Parent civic object
status = 'approved' and is_published = true on the parent civic object

4.3 City Admin scope
city_id of the panorama must be in the admin's admin_users.city_ids array

4.4 Link target eligibility
target_type	Eligibility requirement
civic_entity	is_published = true
civic_event	is_published = true
civic_place	is_published = true
civic_moment	is_published = true
civic_artifact	is_published = true
civic_neighborhood	is_published = true
civic_story	review_status = 'published'
panorama	status = 'published'; must belong to the same city (cross-city: CEO only)
external_url	Valid absolute https:// URL; no further record-level validation


4.5 Cross-city restriction
City Admins may not link a hotspot to any target record (target_id) belonging to a different city_id. Attempting to do so returns a validation error:

"Link target is outside your city scope."

CEOs may create cross-city links via the CEO Dashboard.

5. rpc_validate_hotspot_target
The admin UI calls this RPC before enabling the Save button. It must also be called server-side before any INSERT or UPDATE that modifies target_type, target_id, or target_url.

5.1 Signature
sql


Copy
rpc_validate_hotspot_target(
  p_target_type  TEXT,
  p_target_id    UUID,    -- NULL when target_type = 'external_url'
  p_target_url   TEXT,    -- NULL when target_type ≠ 'external_url'
  p_city_id      UUID
)
RETURNS JSONB
-- { "valid": true }
-- { "valid": false, "reason": "..." }
5.2 Validation logic
Code


Copy
1. Confirm p_target_type is a valid enum value.
2. If target_type = 'external_url':
     a. Confirm p_target_url is not null and begins with 'https://'.
     b. Return { valid: true }.
3. Confirm p_target_id is not null.
4. Look up the target record in the table corresponding to p_target_type.
5. Confirm the target record exists.
6. Confirm target city_id = p_city_id (or caller is CEO).
7. Check publication state:
     - civic_* types: is_published = true
     - civic_story:   review_status = 'published'
     - panorama:      status = 'published'
8. Return { valid: true } or { valid: false, reason: <string> }.
5.3 Error reasons (canonical strings)
reason	Condition
"target_not_found"	No record for p_target_id in the target table
"target_not_published"	Record exists but fails publication check
"target_outside_city_scope"	target city_id ≠ p_city_id and caller is not CEO
"invalid_target_type"	p_target_type not in allowed enum
"invalid_url"	external_url missing or not https://


6. Placing a Hotspot
6.1 Step-by-step
Navigate to Object Manager → [Civic object] → Panoramas → [Published panorama] → Hotspot Editor.

The Hotspot Editor loads the panorama in the 360° interactive viewer in placement mode. A crosshair cursor indicates placement is active.

Click or tap anywhere within the viewer to drop an anchor at that position.

The viewer captures the pointer's position within its bounding box and converts it to pan_x/pan_y (see §6.2).

A temporary anchor marker renders at the clicked position.

The Hotspot Configuration Panel opens (slide-in, right side):

Label — required, max 120 chars

Icon — dropdown of design-system icon keys; auto-suggested based on target_type

Target type — dropdown (civic_entity / civic_event / civic_place / civic_moment / civic_artifact / civic_neighborhood / civic_story / panorama / external_url)

Target — typeahead search (civic objects and stories) or panorama thumbnail picker or URL input, depending on target_type

metadata.short_description — optional, shown in the callout card

metadata.caption / metadata.attribution — optional

When a target is selected, the UI calls rpc_validate_hotspot_target. If valid: false, the reason is shown inline adjacent to the target field and the Save button remains disabled.

City Admin clicks Save Hotspot.

Row inserted with is_active = false (always inactive on creation).

city_id is auto-populated from the parent panorama by trigger.

admin_action_logs entry written (see §10).

The hotspot appears in the Hotspot List Panel with a status badge of "Inactive".

The anchor marker renders in the viewer in a greyed-out inactive style so the City Admin can visually verify position before activating.

6.2 pan_x / pan_y capture
Code


Copy
pan_x = pointerX / viewerWidth
pan_y = pointerY / viewerHeight
Where pointerX/pointerY is the click position relative to the top-left corner of the viewer's bounding box, and viewerWidth/viewerHeight is the current rendered size of the viewer element.

Both values are clamped to [0.0, 1.0] before being sent to the server.

The viewer layer converts pan_x/pan_y to its internal coordinate system (yaw/pitch, spherical, or UV) at render time. See HOTSPOT_MODEL.md §2 for the conversion formulas. No conversion happens at the database layer.

6.3 Position adjustment after save
City Admin may reposition an existing hotspot by:

Dragging the marker within the viewer — pan_x/pan_y update on drag-end.

Entering exact values in the Configuration Panel's coordinate fields (two numeric inputs, 4 decimal places, range 0–1).

Each save writes a hotspot_updated entry to admin_action_logs with metadata.changed_fields containing the old and new values.

7. Activating and Deactivating Hotspots
7.1 Activation
City Admin clicks Activate in either the Hotspot List Panel row or the Configuration Panel.

System: UPDATE hotspots SET is_active = true WHERE id = :id

Before activating, the system re-runs rpc_validate_hotspot_target. If the target has been unpublished since the hotspot was placed, activation is blocked with the validation error reason.

Hotspot becomes immediately visible to anon users in the live viewer.

Audit: action = 'hotspot_activated', domain = 'navigation'.

7.2 Deactivation
City Admin clicks Deactivate.

System: UPDATE hotspots SET is_active = false WHERE id = :id

Hotspot is hidden from the public viewer immediately — no unpublish confirmation required.

The hotspot row, its position, and its target link are preserved.

Audit: action = 'hotspot_deactivated', domain = 'navigation'.

7.3 Bulk activate / deactivate
City Admin may check multiple rows in the Hotspot List Panel and apply Activate all or Deactivate all.

Each hotspot runs rpc_validate_hotspot_target individually before activation.

Hotspots that fail validation are skipped; a summary is shown: "3 of 5 hotspots activated. 2 skipped — targets not published."

Each mutation generates its own admin_action_logs entry.

7.4 Automatic deactivation by system
Hotspots are automatically set to is_active = false (without City Admin action) in two cases:

Trigger	Mechanism
Parent panorama archived (status → 'archived')	trg_panorama_archive_cascade trigger on panoramas (PANORAMA_MODEL.md §6)
Target record unpublished or hidden	Not automatic — City Admin is responsible for auditing active hotspots when civic objects are hidden. The Stale Hotspots warning (§11.4) surfaces these.


8. Reordering Hotspots
display_order controls:

The sequence of hotspot markers in the viewer's list-mode overlay (for low-motion or accessibility views)

The tab order when multiple hotspot callout cards are open simultaneously

The pre-load priority queue in the Unity / WebXR renderer

City Admin reorders by drag-and-drop on the Hotspot List Panel rows. On drop, the system updates display_order for all affected rows in a single transaction.

Each reorder operation writes one hotspot_updated entry per affected row to admin_action_logs, with metadata.changed_fields = { "display_order": { "old": n, "new": m } }.

9. Navigation Hotspots (panorama → panorama)
Navigation hotspots (target_type = 'panorama') let users move between connected panoramas — the immersive equivalent of walking from one space into another.

9.1 Configuration
Set Target type to panorama.

The Target field becomes a Panorama Picker: a thumbnail grid of published panoramas scoped to the same city.

Select the destination panorama. rpc_validate_hotspot_target confirms status = 'published'.

Set Icon to navigate (auto-suggested; overridable).

9.2 Behaviour in the viewer
When a user activates a navigation hotspot:

The viewer replaces the current panorama in-place with the destination panorama.

No page navigation occurs — the URL may update via history.replaceState to reflect the new panorama, but the page shell does not reload.

Hotspots for the destination panorama are fetched and rendered.

A Back affordance appears, allowing the user to return to the originating panorama.

9.3 Reciprocal hotspot prompt
After saving a navigation hotspot, the system checks whether the destination panorama has an active target_type = 'panorama' hotspot pointing back to the source panorama. If none is found, the admin UI shows an advisory prompt:

"Would you like to add a return hotspot on "[Destination Panorama Label]"?"

This is advisory only. The City Admin may dismiss it. Dismissal is not logged.

9.4 Destination panorama archived
When a destination panorama is archived, trg_panorama_archive_cascade deactivates all navigation hotspots pointing to it. The City Admin's Stale Hotspots warning (§11.4) surfaces these as requiring attention.

10. Audit Log Entries
All hotspot mutations are written to admin_action_logs. The domain column is always 'navigation' for hotspot actions.

Code


Copy
actor_user_id  →  auth.users.id of the acting admin
actor_admin_id →  admin_users.id of the acting admin
actor_role     →  'city_admin' or 'ceo'
domain         →  'navigation'
entity_type    →  'hotspots'
entity_id      →  hotspots.id
10.1 action strings and metadata payloads
hotspot_placed

jsonc


Copy
{
  "panorama_id":   "uuid",
  "target_type":   "civic_place",
  "target_id":     "uuid",
  "pan_x":         0.4823,
  "pan_y":         0.5012,
  "label":         "Ferry Building"
}
hotspot_updated

jsonc


Copy
{
  "changed_fields": {
    "pan_x":  { "old": 0.4823, "new": 0.5100 },
    "label":  { "old": "Ferry Building", "new": "Ferry Building Entrance" }
  }
}
hotspot_activated

jsonc


Copy
{ "panorama_id": "uuid" }
hotspot_deactivated

jsonc


Copy
{ "panorama_id": "uuid" }
hotspot_deleted

jsonc


Copy
{
  "panorama_id":  "uuid",
  "target_type":  "civic_place",
  "target_id":    "uuid",
  "label":        "Ferry Building Entrance",
  "reason":       "Duplicate of hotspot [id]"
}
10.2 Addition to CITY_ADMIN_WORKFLOW.md §14.5
The navigation domain row in CITY_ADMIN_WORKFLOW.md §14.5 should be extended as follows:

Navigation — navigation_item_created, navigation_item_updated, navigation_item_deleted, hotspot_placed, hotspot_updated, hotspot_activated, hotspot_deactivated, hotspot_deleted

11. Editing and Deletion
11.1 Editing any field
All fields — label, icon, position (pan_x/pan_y), target, metadata, behavior — may be edited after creation. The Configuration Panel is available whenever the hotspot row is selected in the Hotspot List Panel.

Editing target_type, target_id, or target_url re-triggers rpc_validate_hotspot_target before saving.

If an active hotspot's target fails re-validation on edit (e.g., the target was unpublished in the interim), the edit is permitted but the hotspot is automatically deactivated and the City Admin is shown a warning:

"Target is no longer published. Hotspot has been deactivated."

11.2 Deletion — within 24 hours
City Admins may hard-delete a hotspot within 24 hours of created_at.

A Delete button is visible in the Configuration Panel when NOW() - created_at < INTERVAL '24 hours'.

A confirmation dialog is shown: "Delete this hotspot? This cannot be undone."

On confirm: row is hard-deleted from hotspots. The parent panorama and linked target record are unaffected.

Audit: action = 'hotspot_deleted', with metadata.reason required.

11.3 Deletion — after 24 hours
After 24 hours, the Delete button is hidden for City Admins. The hotspot must be deactivated instead. Hard deletion after 24 hours is a CEO-only action.

11.4 Stale Hotspots warning
The Hotspot List Panel surfaces a Stale badge on any active hotspot whose target no longer passes rpc_validate_hotspot_target. This check runs on panel load (not in real-time). Stale hotspots continue to serve correctly in the public viewer for existing anon sessions (RLS reads is_active = true only — it does not re-validate the target record), but City Admins should investigate and deactivate or retarget them.

12. UI Component Requirements — Hotspot Editor
Component	Requirement
360° viewer	Renders equirectangular panorama; shows hotspot markers at pan_x/pan_y positions; supports click-to-place in placement mode
Placement mode	Activated on page load; crosshair cursor; click drops anchor
Anchor marker	Renders at (pan_x × viewerWidth, pan_y × viewerHeight) pixels from top-left
Drag to reposition	Drag anchor marker within viewer; updates position on drag-end; does not commit until Save is clicked
Coordinate inputs	Two numeric fields (pan_x, pan_y); 4 decimal places; range 0–1; input changes preview marker position in real time
Hotspot List Panel	Table rows: label, target_type icon, target label, is_active badge, display_order; drag handles for reorder
Bulk select	Checkbox column; Activate all / Deactivate all toolbar actions
Configuration Panel	Slide-in from right; no full-page navigation; fields for label, icon, target_type, target, metadata.short_description, metadata.caption, metadata.attribution
Target typeahead	Searches civic objects and civic stories scoped to city; debounced; shows object type icon + title in results
Panorama Picker	Grid of published panorama thumbnails for target_type = 'panorama'
URL input	Plain text field for target_type = 'external_url'; inline validation (must begin https://)
Validation errors	Inline, adjacent to the offending field; not toast-only
Save button state	Disabled until label is non-empty and rpc_validate_hotspot_target returns valid: true
Unsaved changes guard	Warn on panel close or navigation away if Configuration Panel has unsaved changes
Stale badge	Amber badge on Hotspot List Panel rows where target fails current validation
Inactive style	Greyed-out marker and opacity-reduced label for inactive hotspots in placement preview
Delete button	Visible only when NOW() - created_at < 24h; always requires confirmation dialog


13. Unity / VR Admin Considerations
13.1 behavior.world_position
When the admin UI is operating in VR Preview mode, placing or dragging a hotspot also computes and saves behavior.world_position ({x, y, z} in Unity world units) via the browser's 3D projection layer. In standard admin mode, world_position is populated asynchronously by the fn_project_hotspot_world_position background job after save.

City Admins may view but not manually edit behavior.world_position in v1. An Advanced (VR) section of the Configuration Panel (collapsed by default; visible in VR Preview mode) exposes the following behavior keys:

Key	Label	Input type
linger_ms	Gaze dwell duration	Number (ms), default 1500
haptic_preset	Haptic feedback	Select: soft / medium / strong
animation	Entrance animation	Select: pulse / beacon / static / orbit


13.2 VR Preview mode
City Admin can toggle VR Preview from the Hotspot Editor toolbar. This loads the panorama in a WebXR immersive-vr session (if the browser supports navigator.xr):

Active hotspots render as 3D floating markers using behavior.world_position (or pan_x/pan_y projection fallback).

Callout cards render as floating panels in 3D space.

Inactive hotspots are visible in preview but visually distinct (ghost style).

13.3 interaction_radius
behavior.interaction_radius (metres) controls the sphere within which gaze or controller proximity triggers the hotspot in VR. Default: 0.35. Editable in the Advanced (VR) panel section.

