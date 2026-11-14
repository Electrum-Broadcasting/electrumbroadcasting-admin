# HOTSPOT_FOUNDATION.md

Electrum Civic Atlas

Authoritative Hotspot Foundation Specification

Version 1.0

---

## 1. Purpose

Hotspot Foundation establishes the authoritative architecture for spatial navigation within Electrum.

It defines:

- What a hotspot is
- Why hotspots exist
- What hotspots may target
- Navigation semantics
- Discovery principles
- Spatial relationship principles

It does not define:

- Database schema
- Coordinate storage
- Placement workflows
- Administrative tooling
- Validation RPCs

These concerns are governed by:

- HOTSPOT_MODEL.md
- HOTSPOT_WORKFLOW.md

---

## 2. Core Principle

A hotspot is not a marker.

A hotspot is a navigable civic relationship anchored in physical space.

Every hotspot answers the question:

What can I discover from here?

A hotspot transforms a panorama from:

A place to observe

into:

A place to explore.

---

## 3. The Role of Hotspots

Panoramas establish:

Presence

Orientation

Context

Hotspots establish:

Discovery

Traversal

Connection

Together they form the Spatial Register.

Without hotspots:

A panorama is a destination.

With hotspots:

A panorama becomes part of a larger world.

---

## 4. Spatial Navigation Philosophy

Electrum is not intended to behave like:

A collection of disconnected pages.

Visitors should experience:

Observation

       ↓

Recognition

       ↓

Curiosity

       ↓

Discovery

       ↓

Navigation

This loop is fundamental to the Atlas.

---

## 5. Hotspot Types

A hotspot may target:

### Civic Object

Place

Neighborhood

Entity

Event

Artifact

Moment

---

### Story

Story

A narrative interpretation of the surrounding civic landscape.

---

### Panorama (Future Capability)

Panorama-to-panorama hotspot traversal is a future navigation capability.

The current Electrum prototype uses PanoramaThumbs as the authoritative mechanism for switching viewpoints within a civic object.

Panorama hotspots are deferred.

---

### External Resource

External URL

Used sparingly.

External targets should be exceptional, not routine.

---

## 6. Navigation Semantics

Navigation depends upon target type.

---

### Panorama navigation exists only within the currently active civic object.

For MVP:

Hotspots should primarily target:

- Places
- Neighborhoods
- Entities
- Events
- Artifacts
- Moments
- Stories

Cross-object panorama-to-panorama navigation is deferred until a future navigation phase.

---

### Panorama → Civic Object

Navigate to the destination object page.

Examples:

Place

Entity

Artifact

Moment

Neighborhood

Purpose:

Movement through civic knowledge.

---

### Panorama → Story

Open the Story page.

Purpose:

Movement from space into narrative.

---

### Panorama → External Resource

Leave the Atlas intentionally.

Users must understand they are leaving Electrum.

---

## 7. Spatial Discovery Priority

Hotspots should reveal:

### Nearby significance

Examples:

Visible landmarks

Related institutions

Historic sites

Contributing artifacts

---

### Historical significance

Examples:

Events

Moments

Stories

that occurred within the visible landscape.

---

### Spatial continuity

Examples:

Additional panoramas

Alternative viewpoints

Interior spaces

---

## 8. Civic Integrity

Hotspots are not advertisements.

Hotspots are not promotional overlays.

Hotspots are not decorative UI ornaments.

A hotspot must represent:

A meaningful civic relationship.

---

## 9. Visibility Principles

A hotspot should be:

Discoverable

Readable

Contextual

but never:

Intrusive

Overwhelming

Visually dominant

The panorama remains the stage.

Hotspots are guides within that stage.

---

## 10. Relationship To Stories

Stories serve as the transition between:

Spatial Register

and:

Curatorial Register

Hotspots provide one path into that transition.

Example:

Place

      ↓

Story

A visitor standing at Lake Merritt discovers a story explaining the site's civic significance.

---

## 11. Relationship To the Atlas

The Atlas is not:

A folder of pages.

It is:

A connected civic landscape.

Hotspots are the connective tissue that makes that landscape traversable.

Without hotspots:

Objects are isolated.

With hotspots:

Objects become a world.

---

## 12. Accessibility

All hotspot interactions must support:

Keyboard navigation

Visible focus indicators

Screen readers

Reduced motion preferences

Discovery must remain accessible regardless of input method.

---

## 13. MVP Success Criteria

Hotspot Foundation MVP is complete when:

1. Hotspots can be attached to panoramas.
2. Hotspots can target civic objects.
3. Hotspots can target stories.
4. Hotspots can target civic objects and stories.
5. Hotspots support keyboard and pointer interaction.
6. Hotspots participate in immersive navigation.
7. Hotspots preserve civic context across navigation.

Panorama-to-panorama hotspot traversal is deferred and does not form part of the MVP requirement set.

At MVP:

Advanced animation optional

VR gaze interactions optional

Spatial audio integration optional

Unity-specific behaviors optional

The objective is:

Discovery through space.

---

## 14. Explicit Deferrals

The following are outside Hotspot Foundation scope:

Spatial audio

Haptic feedback

Volumetric navigation

AR overlays

Memory pinning

Community annotations

Multiplayer exploration

AI-generated navigation

These belong to future phases.

---

## 15. Architectural Dependencies

Hotspot Foundation depends upon:

MEDIA_FOUNDATION.md

PANORAMA_FOUNDATION.md

Implementation sequence:

Media Foundation

      ↓

Panorama Foundation

      ↓

Hotspot Foundation

Together these systems establish the Dual-Register architecture that defines the Electrum Civic Atlas.


## 16. Hotspot Visibility & Projection

Hotspots exist in spherical space and are rendered relative to the active camera.

Implementations must support:

- Meridian wrapping at ±180°
- Camera-relative projection
- Visibility culling for
  off-screen hotspots

Storage coordinates remain viewer-independent.

Projection behavior is determined by the viewer implementation and must not alter stored hotspot data.

## 17. Interaction States

Desktop implementations may provide:

- Hover state
- Focus state
- Preview state

Activation initiates navigation immediately.

Camera-centering animations prior to navigation are optional enhancements and are not required behavior.

Mobile implementations may bypass hover behavior and proceed directly from activation to navigation.

Both experiences must preserve the same civic destination.

## 18. Visual Presentation

Hotspots consist of:

- Gold core marker
- Animated pulse ring
- Glassmorphic label badge

The badge displays:

- Object type
- Target title

Labels should remain subordinate to the panorama while remaining readable.

Exact typography tokens, glow values,spacing, and animation timings belong to the design system rather than the foundation specifications.

