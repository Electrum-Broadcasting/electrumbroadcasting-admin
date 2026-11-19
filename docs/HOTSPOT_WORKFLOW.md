HOTSPOT_WORKFLOW.md
Electrum — City Admin Hotspot Management Workflow
Compatibility: DATA_MODEL.md · HOTSPOT_MODEL.md · PANORAMA_MODEL.md · CITY_ADMIN_WORKFLOW.md
Last updated: 2026-10-09

1. Purpose & Scope
This document defines the end-to-end workflow City Admins follow to create, configure, activate, and manage hotspots within 360° panoramas.

Specification authority is: IMMERSIVE_EXPERIENCE_VISION.md > OBJECT_PAGE_MODEL.md >
PANORAMA_MODEL.md > HOTSPOT_MODEL.md > HOTSPOT_WORKFLOW.md. This workflow must not override
behavior or feature states in the higher-level specifications.

For schema details, field definitions, RLS policies, and coordinate system documentation, see HOTSPOT_MODEL.md.
For panorama upload and lifecycle, see PANORAMA_MODEL.md.

M9B implementation: the Panorama Manager has a flat-image UV placement surface,
numeric coordinate inputs, target search/validation, and guarded place, update,
activate, deactivate, and delete actions. The immersive viewer, bulk operations,
reordering UI, stale badges, and public traversal described below are future
work. Draft and deactivated hotspots share the same stored inactive state.
The former 24-hour deletion restriction is superseded by the deployed governance:
City Admins may delete hotspots in their assigned cities at any age; CEO and
PLATFORM_ADMIN may delete across cities. Every mutation is audited.

This document covers:

Role permissions and access path

Prerequisites and target eligibility rules

Server-side target validation

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
Delete hotspot at any age	✅	✅
View hotspots across all cities	❌	✅
Link hotspot to a target in another city	❌	❌


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
M9B can place and activate hotspots on draft or published panoramas. Archived
panoramas cannot receive new hotspots or activate hotspots.

4. Prerequisites
All of the following must be true before a hotspot can be placed or activated.

4.1 Parent panorama
panoramas.status is not 'archived'

4.2 Parent civic object
The parent civic object must exist and be accessible to the administrator.

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
civic_story	is_published = true and safety_hold = false
panorama	Not supported by M9B; activation is deferred for the MVP
external_url	Valid absolute https:// URL; no further record-level validation


4.5 Cross-city restriction
No actor may link a hotspot to a target record (target_id) belonging to a different city_id. Attempting to do so returns a validation error:

"Link target is outside your city scope."

Cross-city hotspot traversal
deferred to future
multi-city governance work.

5. Server-side target validation
The authenticated hotspot service checks the target type, existence, same-city
scope, publication, and anonymous-read accessibility on save and activation.
Stories must also be free of safety holds. An external URL must be a valid HTTPS
URL without embedded credentials; destination reachability is not checked.
The database trigger independently checks existence and city when targets change,
and publication when a hotspot is activated. There is no deployed
`rpc_validate_hotspot_target` RPC.
Service checks and mutation RPCs are separate requests, so target visibility can
change between them. The trigger checks publication at activation, but neither
it nor the service continuously deactivates already-active stale targets.


6. Placing a Hotspot
6.1 Step-by-step
Navigate to Object Manager → [Civic object] → Panoramas → [Draft or published panorama] → Manage hotspots.

The M9B editor shows the flat equirectangular image with a crosshair cursor.

Click or tap the desired point in the image, or enter exact UV coordinates.

The image-relative position is saved as source-panorama UV coordinates pan_x/pan_y (see §6.2).

A temporary anchor marker renders at the clicked position.

The hotspot editor includes:

Label — required, max 120 chars

Target type — civic entity, event, place, moment, artifact, neighborhood, story, or external URL

Target — search and select a published civic object, enter its ID, or enter an HTTPS URL

M9B validates a selected search result, provides a Validate target action, and
always validates on save; errors are shown in the editor. Search returns at most
30 matching published targets.

City Admin clicks Save Hotspot.

Row inserted with is_active = false (always inactive on creation).

city_id is auto-populated from the parent panorama by trigger.

admin_action_logs entry written (see §10).

The hotspot appears in the Hotspot List Panel with a status badge of "Inactive".

The editor shows an anchor marker on the flat image while placing or editing.

6.2 pan_x / pan_y capture
Code


Copy
The image click is mapped directly to normalized UV coordinates on the flat
equirectangular image. A future spherical viewer must convert its camera ray
to the corresponding source-image UV coordinates.

pan_x and pan_y are normalized coordinates on the source panorama, not viewport or screen-pixel
coordinates. The same source-to-viewer projection is used to render and reposition hotspots;
visible marker positions change with camera orientation. See HOTSPOT_MODEL.md §2. No conversion
happens at the database layer.

6.3 Position adjustment after save
City Admin may reposition an existing hotspot by clicking the flat image.

City Admin may also enter exact source-panorama UV values in the Configuration Panel's coordinate
fields (two numeric inputs, 4 decimal places, range 0–1). Input changes preview the
marker on the flat image.

Each save writes a hotspot_updated entry to admin_action_logs with metadata.changed_fields containing the old and new values.

7. Activating and Deactivating Hotspots
7.1 Activation
City Admin clicks Activate in either the Hotspot List Panel row or the Configuration Panel.

System: call `admin_set_hotspot_active` through the authenticated service.

Before activating, the service revalidates the target. If the target has been unpublished since placement, activation is blocked.

An active hotspot is eligible for anonymous reads when its parent panorama is
published. Public viewer traversal is deferred.

Audit: action = 'hotspot_activated', domain = 'navigation'.

7.2 Deactivation
City Admin clicks Deactivate.

System: call `admin_set_hotspot_active` through the authenticated service.

Hotspot is hidden from the public viewer immediately — no unpublish confirmation required.

The hotspot row, its position, and its target link are preserved.

Audit: action = 'hotspot_deactivated', domain = 'navigation'.

7.3 Bulk activate / deactivate
Deferred for M9B.
City Admin may check multiple rows in the Hotspot List Panel and apply Activate all or Deactivate all.

If implemented, each hotspot must be individually validated before activation.

Hotspots that fail validation are skipped; a summary is shown: "3 of 5 hotspots activated. 2 skipped — targets not published."

Each mutation generates its own admin_action_logs entry.

7.4 Publication changes and automatic deactivation
Only archiving the parent automatically sets its active hotspots to is_active = false:

Trigger	Mechanism
Parent panorama archived (status → 'archived')	trg_panorama_archive_cascade trigger on panoramas (PANORAMA_MODEL.md §6)
Target record unpublished or hidden	Not automatic; target eligibility is checked at activation, not continuously thereafter. Continuous enforcement is deferred.
Parent panorama returned to draft	Active flags remain unchanged, but public RLS hides hotspots while the parent is draft. They can become visible again when the panorama is republished. Accepted Category B limitation.


8. Reordering Hotspots
The reorder UI is deferred for M9B.
display_order controls:

The sequence of hotspot markers in the viewer's list-mode overlay (for low-motion or accessibility views)

The tab order when multiple hotspot callout cards are open simultaneously

The pre-load priority queue in a future Unity / WebXR renderer (not an implementation requirement)

City Admin reorders by drag-and-drop on the Hotspot List Panel rows. On drop, the system updates display_order for all affected rows in a single transaction.

Each reorder operation writes one hotspot_updated entry per affected row to admin_action_logs, with metadata.changed_fields = { "display_order": { "old": n, "new": m } }.

9. Navigation Hotspots (panorama → panorama)
Panorama targets and traversal are deferred for M9B.
Navigation hotspots (target_type = 'panorama') let users move between connected panoramas — the immersive equivalent of walking from one space into another.

9.1 Configuration
Set Target type to panorama.

The Target field becomes a Panorama Picker: a thumbnail grid of published panoramas scoped to the same city.

Select the destination panorama. This workflow is deferred for M9B.

Set Icon to navigate (auto-suggested; overridable).

9.2 Navigation behavior by target type

| Target type | Visitor behavior |
|---|---|
| `panorama` | Remain within the immersive viewer and load the destination panorama. Preserve the curatorial context and page shell. A seamless 0.6-second exposure-style cross-fade is Intended Behavior; panorama switching does not navigate to a civic-object page. |
| Civic object (`civic_entity`, `civic_event`, `civic_place`, `civic_moment`, `civic_artifact`, `civic_neighborhood`) | Navigate to the target object's Object Page (for example, an Artifact hotspot opens its Artifact page). |
| `civic_story` | Navigate to the target Story Page. |
| `external_url` | Leave the Atlas intentionally by opening the destination in a new tab. |

For panorama-to-panorama traversal, fetch and render the destination panorama's hotspots. A Back
affordance may return to the originating panorama within the viewer. Cross-fading is an intended
target, not a claim that the transition is implemented.

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

Changing an active hotspot's target type or target ID rechecks eligibility. An ineligible
target is rejected; it is not automatically deactivated. Unrelated edits do not continuously
recheck the existing target.

11.2 Deletion
City Admins may hard-delete a hotspot in their assigned city at any age; CEO and
PLATFORM_ADMIN may do so across cities.

A confirmation dialog is shown: "Delete this hotspot? This cannot be undone."

On confirm: row is hard-deleted from hotspots. The parent panorama and linked target record are unaffected.

Audit: action = 'hotspot_deleted'; the guarded RPC accepts an optional reason.

11.3 Stale Hotspots warning
M9B does not provide stale badges or continuously revalidate active targets.
The public RLS policy does not revalidate target publication. City Admins should
deactivate or retarget hotspots whose destinations become unavailable.

12. UI Component Requirements — Hotspot Editor
The following describes the intended future immersive editor unless marked
otherwise; the M9B implementation is summarized at the top of this document.
Component	Requirement
360° viewer	Renders equirectangular panorama; projects source-panorama UV hotspots into viewer space based on camera orientation; supports placement
Viewer behavior	Intended behavior: 3°/second auto-rotation; +14°/-14° pitch lock; drag interaction; compass awareness; camera-aware hotspot positioning and viewport clipping; auto-rotation yields to interaction. The authoritative vision classifies the panorama canvas and UV hotspots as Current Implementation.
Placement mode	Activated on page load; crosshair cursor; click maps a camera ray to source-panorama UV coordinates
Anchor marker	Rendered at the camera-projected position of source-panorama pan_x/pan_y; never calculated as (pan_x × viewerWidth, pan_y × viewerHeight)
Drag to reposition	Drag the projected marker; convert camera interaction back to source-panorama UV on drag-end; do not commit until Save is clicked
Coordinate inputs	Two source-panorama UV fields (pan_x, pan_y); 4 decimal places; range 0–1; input changes preview the camera-projected marker in real time
Hotspot List Panel	Table rows: label, target_type icon, target label, is_active badge, display_order; drag handles for reorder
Bulk select	Checkbox column; Activate all / Deactivate all toolbar actions
Configuration Panel	Slide-in from right; no full-page navigation; fields for label, icon, target_type, target, metadata.short_description, metadata.caption, metadata.attribution
Target typeahead	Searches civic objects and civic stories scoped to city; debounced; shows object type icon + title in results
Panorama Picker	Grid of published panorama thumbnails for target_type = 'panorama'
URL input	Plain text field for target_type = 'external_url'; inline validation (must begin https://)
Validation errors	Inline, adjacent to the offending field; not toast-only
Save button state	Validation is performed server-side when Save is clicked
Unsaved changes guard	Warn on panel close or navigation away if Configuration Panel has unsaved changes
Stale badge	Amber badge on Hotspot List Panel rows where target fails current validation
Inactive style	Greyed-out marker and opacity-reduced label for inactive hotspots in placement preview
Delete button	Available at any age to authorized admins; requires confirmation


13. Future Possibilities — Unity / VR Admin Concepts
The items in this section are not approved implementation scope. They are retained as concepts
only; the presence of these notes or behavior keys is not an implementation requirement. WebXR /
headset mode for visitors is Intended Behavior in the authoritative vision, but an admin VR
Preview workflow and Unity integration are not established as current or approved capabilities.

13.1 behavior.world_position
Concept only: a future VR Preview could compute a behavior.world_position ({x, y, z} in Unity
world units). This document does not establish such a preview, projection layer, or background
job.

The following is a possible future Advanced (VR) section, not a current admin requirement:

Key	Label	Input type
linger_ms	Gaze dwell duration	Number (ms), default 1500
haptic_preset	Haptic feedback	Select: soft / medium / strong
animation	Entrance animation	Select: pulse / beacon / static / orbit


13.2 VR Preview mode
A possible future City Admin VR Preview could load the panorama in a WebXR immersive-vr session:

Active hotspots render as 3D floating markers using behavior.world_position (or pan_x/pan_y projection fallback).

Callout cards render as floating panels in 3D space.

Inactive hotspots are visible in preview but visually distinct (ghost style).

13.3 interaction_radius
behavior.interaction_radius (metres) controls the sphere within which gaze or controller proximity triggers the hotspot in VR. Default: 0.35. Editable in the Advanced (VR) panel section.
