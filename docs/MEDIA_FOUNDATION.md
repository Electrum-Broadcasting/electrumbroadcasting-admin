# MEDIA_FOUNDATION.md

Electrum Civic Atlas

Authoritative Media Foundation Specification

Version 1.0

---

## 1. Purpose

Media Foundation establishes the canonical media architecture for Electrum.

It defines:

- Media ownership
- Media attachment
- Media roles
- Storage conventions
- Metadata requirements
- Accessibility requirements
- Fallback behavior
- Contributor responsibilities

It does not define:

- Panorama rendering
- Hotspot behavior
- Panorama navigation
- WebXR
- Spatial audio
- Atlas navigation

Those systems are governed separately by:

- PANORAMA_MODEL.md
- HOTSPOT_MODEL.md
- HOTSPOT_WORKFLOW.md
- OBJECT_PAGE_MODEL.md

Media Foundation exists to provide a stable substrate upon which those systems can operate.

---

## 2. Core Principle

Electrum follows the Dual-Register model.

Media serves two distinct functions:

### Spatial Register

Used for:

- Presence
- Orientation
- Context
- Discovery

Examples:

- 360° panoramas
- Immersive viewers
- Spatial navigation

Governed by Panorama Foundation.

---

### Curatorial Register

Used for:

- Evidence
- Explanation
- Narrative
- Inspection

Examples:

- Hero images
- Historical photographs
- Maps
- Blueprints
- Documentary photography
- Editorial imagery

Governed by Media Foundation.

---

## 3. Media Roles

Every media asset must belong to one and only one role.

### HERO

Primary visual representation.

Purpose:

- Object identity
- Editorial emphasis
- Fallback for immersive surfaces

Cardinality:

0..1 primary attachment per civic object.

---

### THUMBNAIL

Compact representation.

Purpose:

- Search
- Cards
- Lists
- Mobile summaries

Cardinality:

0..1 primary attachment per civic object.

If no thumbnail exists:

thumbnail = hero

may be used.

---

### GALLERY

Supporting visual material.

Purpose:

- Additional viewpoints
- Documentation
- Context
- Architectural details

Cardinality:

0..N non-primary attachments per civic object.

---

### EVIDENCE

Historical or documentary material.

Examples:

- Historic photographs
- Maps
- Blueprints
- Surveys
- Posters
- Documents

Cardinality:

0..N non-primary attachments per civic object.

---

## PANORAMA

Reserved.

Governed exclusively by Panorama Foundation.

Media Foundation does not define panorama behavior.

---

## 4. Supported Civic Objects

Media Foundation applies to:

Places

Neighborhoods

Entities

Events

Artifacts

Moments

Stories

Each object may attach:

Hero

Thumbnail

Gallery

Evidence

using a common attachment model.

---

## 5. Attachment Model

Media belongs to:

A civic object

not merely a storage path.

The canonical relationship is:

Object

    ↓

Media Attachment

    ↓

Stored Asset

This prevents:

- duplicate ownership
- slug-based fragmentation
- storage-path coupling

Object identity must remain independent from storage location.

`civic_media_attachments` is the authoritative attachment layer for hero,
thumbnail, gallery, and evidence media. Its role cardinalities are:

| Role | Cardinality |
|---|---|
| hero | 0..1 primary |
| thumbnail | 0..1 primary |
| gallery | 0..N |
| evidence | 0..N |

Each attachment references an asset in the existing platform `media_assets`
registry. The registry is not owned by Civic Media Foundation; this
specification governs the civic-object-to-asset attachment.

### Compatibility fields

`hero_image_url`, `thumbnail_url`, `media_urls`, and `inline_360_urls` are
legacy compatibility fields slated for future deprecation. New attachment
reads and writes must use `civic_media_attachments`; these legacy fields are
not authoritative.

`hero_360_url` is a generated compatibility field. Its authoritative source is
the primary published panorama, and it must not be independently authored.

---

## 6. Storage Foundation

Authoritative bucket:

universal-media

No new civic-media buckets may be added without architecture review.

---

### Canonical Path Structure

cities/{cityId}/

  {objectType}/

    {objectId}/

      {role}/

        {assetId}.{extension}

Example:

cities/f803.../

  places/

    72ad.../

      hero/

        14fa....jpg

Paths must be based on stable identifiers.

Never:

- titles
- names
- slugs

because those may change.

---

## 7. Metadata Requirements

Every media asset must support:

## Required

storage path

mime type

created timestamp

uploaded by

---

### Accessibility

alt text

or

decorative = true

must be supplied.

---

### Attribution

Capture if known:

photographer

source

source_url

license

rights_notes

Unknown values are acceptable.

Missing attribution must never silently imply ownership.

---

## 8. Contributor Model

Contributors retain ownership of their work unless explicitly stated otherwise.

Electrum records:

contributor identity

uploading administrator

attribution data

but Media Foundation does not govern payment or licensing agreements.

Those remain separate concerns.

---

## 9. Rendering Hierarchy

The rendering system should follow:

### Tier 1

Published panorama

Governed by Panorama Foundation.

---

### Tier 2

Hero image

---

### Tier 3

Inherited parent panorama

---

### Tier 4

Evidence image

---

### Tier 5

Atmospheric Electrum fallback

Never:

- broken image icon
- empty frame
- collapsed layout

---

## 10. Preview Requirements

All City Admin media workflows must support:

Upload

Preview

Replace

Remove

before an object is published.

Preview must use:

- responsive rendering
- accurate aspect ratio
- visible attribution metadata when present

---

## 11. Explicit Non-Goals

Media Foundation does not define:

- Panorama viewer
- Panorama records
- Hotspots
- Hotspot placement
- Spatial linking
- WebXR
- Spatial audio
- Panorama publication
- Panorama permissions

These concerns are intentionally deferred.

---

## 12. Success Criteria

Media Foundation is complete when:

- Every civic object type can attach ordinary media.
- Every civic object type can preview ordinary media.
- Every civic object type can replace ordinary media.
- Every civic object type can render ordinary media consistently.
- All new civic uploads use universal-media.
- Contributor attribution can be preserved.
- Accessibility metadata can be preserved.
- Fallback behavior remains stable.
- Media Foundation must support future immersive-media implementation, but does not itself define viewer, hotspot, or navigation behavior.
