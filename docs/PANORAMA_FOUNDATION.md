# PANORAMA_FOUNDATION.md

Electrum Civic Atlas
Authoritative Panorama Foundation Specification
Version 1.0

---

## 1. Purpose

Panorama Foundation establishes the authoritative architecture for Electrum's Spatial Register.

It defines:

- What a panorama is
- How panoramas are attached to civic content
- Viewer behavior
- Camera behavior
- Panorama lifecycle
- Panorama ownership
- Panorama navigation
- Panorama fallback behavior

Panorama Foundation does not define:

- Media uploads generally
- Hero images
- Galleries
- Attribution workflows
- Hotspot management
- Hotspot placement
- Hotspot governance

Those concerns belong to:

- MEDIA_FOUNDATION.md
- HOTSPOT_FOUNDATION.md

---

## 2. Core Principle

A panorama is not a decorative image.

A panorama is a spatial environment.

Its purpose is to establish:

Presence

Orientation

Scale

Context

Spatial Discovery

The panorama is the visual embodiment of the Spatial Register described in:

IMMERSIVE_EXPERIENCE_VISION.md

Every panorama answers:

Where am I?

What surrounds me?

What can I discover next?

before the Curatorial Register answers:

Why does this matter?

---

## 3. Panorama Philosophy

Electrum is not:

Street View

and is not:

A photograph displayed in a 360 viewer.

Instead:

Every panorama is a curated civic vantage point.

Panoramas are selected to reveal:

- Relationships between civic objects
- Historic sightlines
- Architectural context
- Cultural geography
- Spatial memory

The panorama is the stage.

Hotspots, stories, objects, and timelines are actors upon that stage.

---

## 4. Authoritative Panorama Format

Electrum's production panorama format is:

360° Equirectangular Image

### Requirements:

2:1 aspect ratio

Full spherical capture

Horizontally continuous

Suitable for UV-based hotspot positioning

Examples:

4096 × 2048

8192 × 4096

Preferred storage format:

JPEG

WebP

All panorama assets use universal-media.Separate panorama buckets are prohibited unless explicitly approved through architecture review.

---

### Explicit Non-Formats

The following are not panorama records:

Scrolling panorama strips

Horizontal image loops

Cropped banner panoramas

Hero background photographs

While these may appear in prototypes, they are visual stand\-ins rather than authoritative production formats.

---

## 5. Panorama Ownership

A panorama belongs to exactly one parent object.

Eligible parent types:

Place

Neighborhood

Event

Story

Additional support:

Entity

Moment

Artifact

when spatial context materially improves understanding.

A parent object may contain:

0..N panoramas

The panorama with the lowest display_order value is considered the primary panorama.

Future implementations may introduce an explicit primary-panorama attribute, but display_order remains the authoritative MVP mechanism.

---

## 6. Spatial Priority Rules

Panoramas should be preferred when:

Location is the subject.

Examples:

Place

Neighborhood

Event site

Story opening scene

Panoramas may remain primary when: 

an Artifact or Entity possesses meaningful spatial context.

However, object inspection, portraiture, archival materials, blueprints, and evidentiary media remain the preferred medium for detailed examination.

---

## 7. Viewer Requirements

The Electrum panorama viewer must support:

### Camera Control

Yaw

Pitch

---

### User Inputs

Mouse drag

Touch drag

Keyboard navigation

Viewer Control Cluster:
  - Rotate Left (30°)
  - Rotate Right (30°)
  - Look Up (5°)
  - Look Down (5°)
  - Reset View
  - Auto-Rotation Toggle
  - Motion Toggle

Reset View returns the camera to pan_x_initial and pan_y_initial.

The Viewer Control Cluster must be available regardless of pointer-device capability and should remain accessible on mobile, tablet, and desktop devices.
---

### Compass

The current heading remains visible.

Compass orientation is part of the Spatial Register.

---

### Auto-Rotation

Default:

3° per second

Purpose:

Establish dimensionality

Auto-rotation stops immediately upon user interaction.

---

### Auto-Rotation Resumption

Any qualifying user interaction:

- Mouse drag
- Touch drag
- Keyboard navigation
- Control cluster interaction

immediately pauses auto-rotation.

Auto-rotation remains paused
indefinitely.

Automatic idle-time restoration is
prohibited.

Auto-rotation resumes only through
explicit user activation of the
Play control.

Purpose:

Prevent unexpected camera movement
while reading, inspecting hotspots,
or reviewing curatorial content.

---

### Pitch Limits

Maximum pitch:

+14°

Minimum pitch:

−14°

The horizon remains the dominant point of reference.

---

## Keyboard Navigation

Arrow-key navigation provides discrete camera movement.

Default increments:

Left Arrow:
  yaw -15°

Right Arrow:
  yaw +15°

Up Arrow:
  pitch +4°

Down Arrow:
  pitch -4°

Implementations may animate between states but must preserve equivalent camera movement.

## 8. Initial Camera State

Every panorama stores:

pan_x_initial

pan_y_initial

These establish:

Initial heading

Initial pitch

The first view should present the most meaningful civic sightline.

Examples:

Lake shoreline

Historic façade

Neighborhood corridor

Assembly ground

View toward a landmark

---

## 9. Panorama Lifecycle

States:

Draft

Published

Archived

Purpose:

Separate spatial assets from civic-object publication.

A civic object may be published before a panorama exists.

A panorama may be prepared before becoming public.

Panorama publication should not alter civic-object governance.

---

## 10. Multiple Panorama Support

A civic object may contain multiple panoramas.

Examples:

Street view

Aerial view

Interior view

Historic reconstruction

Display order must be defined.

One panorama remains active at a time.

Intended behavior:

Immediate panorama replacement is acceptable behavior.

Panorama thumbnail switches viewpoint.

Panorama switches within a single object update the active panorama in viewer state.

No route transition occurs.

No URL change is required.

The PanoramaThumbs control is the authoritative intra-object panorama navigation mechanism.

---

## 11. Panorama Navigation

Electrum supports three navigation categories.

### Intra-Object Navigation

Panorama A

      ↓

Panorama B

within the same object.

No page transition.

---

### Inter-Object Navigation

Current panorama

      ↓

Target civic object

Page transition occurs.

Preserves spatial continuity.

---

### Story Navigation

Panorama

      ↓

Story

Transitions into the Curatorial Register.

---

## 12. Graceful Degradation

Electrum follows the Archival Dignity Rule.

Public users must never encounter:

Broken viewer

Empty hero

Missing-media notice

---

### Tier 1

Published panorama.

---

### Tier 2

Curated hero image.

---

### Tier 3

Parent-object panorama inheritance.

Example:

Neighborhood panorama

used as Place fallback.

Inherited panorama views use curator-defined orientation values.

Automatic GPS-to-UV projection is not required.

The inherited perspective should be established through manually selected camera vectors that orient the visitor toward the most relevant view of the child object.

Storage implementation is deferred to future data-model specifications.

---

### Tier 4

Historical imagery

Maps

Blueprints

Illustrative reconstruction

---

### Tier 5

Electrum atmospheric fallback.

---

## 13. Accessibility

Support:

Keyboard navigation

Visible focus indicators

Screen-reader labeling

Reduced motion preferences

For:

prefers-reduced-motion

disable:

Auto-rotation

Continuous animation

Ambient drift

while preserving full navigation capability.

---

## 14. Relationship to Stories

Story Pages are hybrid experiences.

The panorama acts as:

Establishing shot

The narrative body acts as:

Curatorial Record

Interactive panoramas should not interrupt normal reading flow.

Spatial exploration occurs before or after deep reading, not throughout body paragraphs.

---

## 15. MVP Success Criteria

Panorama Foundation MVP is complete when:

1. A City Admin can attach a 360° equirectangular image to a civic object.
2. The image renders inside the immersive viewer.
3. The viewer supports yaw and pitch.
4. Auto-rotation operates at 3°/second and yields to interaction.
5. The compass reflects current heading.
6. Initial heading and pitch can be configured.
7. Multiple panoramas may be associated with an object.
8. Graceful degradation functions correctly.
9. The panorama becomes the primary Spatial Register for Places and Neighborhoods.

At this stage:

Hotspots optional

WebXR optional

Spatial audio optional

Historical overlays optional

The MVP objective is:

Presence before navigation.

---

## 16. Explicit Deferrals

The following belong to future phases:

Hotspot authoring

Hotspot rendering

WebXR

AR

Spatial audio

Video panoramas

Volumetric reconstruction

Temporal overlays

Community memory pinning

Unity-specific integrations

---

## 17. Architectural Dependencies

Panorama Foundation depends upon:

MEDIA_FOUNDATION.md

Hotspot Foundation depends upon:

PANORAMA_FOUNDATION.md

Implementation sequence:

Media Foundation

      ↓

Panorama Foundation

      ↓

Hotspot Foundation

This dependency hierarchy preserves the Dual-Register model and ensures that immersive navigation rests upon a stable media architecture.

## 18. Interaction Guardrails

Interactive inputs shall not interfere
with form interaction.

### When keyboard focus is inside:

- Search fields
- Text inputs
- Textareas
- Select controls

camera-navigation shortcuts must be disabled.

### Pointer-drag interaction must support:

- Pointer capture
- Drag persistence outside element bounds
- Click-versus-drag discrimination

### Pointer Capture Exclusions

Pointer capture must not activate when the initiating interaction occurs on an interactive descendant element.

Examples:

- Buttons
- Links
- CTA controls
- Hotspot actions

Interactive controls retain ownership of their pointer events.

Panorama drag capture begins only when the interaction originates within the navigation surface itself.

Purpose:

Prevent accidental drag initiation from suppressing hotspot activation or link navigation.
