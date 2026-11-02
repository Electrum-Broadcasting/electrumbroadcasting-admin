#SPONSORSHIP_CREATIVE_ASSETS_MODEL.md
Electrum Civic Atlas — Creative Asset Specification
Version 1.0 (Launch‑Ready, VR‑Safe)

## 1. Overview
Creative Assets are sponsor‑provided media used in Story, Object, Timeline, and future placement surfaces. Assets must be ADA‑compliant, brand‑safe, and stored in a governed folder structure.

This specification defines:

Asset types

Dimensions

Storage paths

Rendering rules

360° asset support (optional, future‑ready)

Validation rules

Fallback logic

## 2. Creative Asset Entity
Field	Type	Description
asset_id	uuid	Primary key
campaign_id	uuid FK → sponsorship_campaigns	Campaign
asset_type	enum	Rendering category
asset_url	text	Storage path
created_at	timestamptz	Audit
updated_at	timestamptz	Audit


## 3. Storage Path Convention
All assets follow this strict path:

Code
sponsorships/{sponsor_id}/campaigns/{campaign_id}/{filename}


## 4. Supported Asset Types (Launch)
Electrum supports four placement-specific asset types at launch:

### 4.1 story_promo
Used on Story Pages

Square or horizontal

Recommended: 800×800 or 1200×600

Must include alt text

For placement-specific creatives, store the non-empty alt text in that creative
asset's `metadata.alt_text`. Do not use a separate campaign-level `alt_text` asset
to describe multiple creatives.

### 4.2 object_promo
Used on Object Pages

Square or horizontal

Recommended: 800×800 or 1200×600

### 4.3 timeline_promo
Used on Timeline Pages

Wide-format

Recommended: 1600×600 or 1920×720

### 4.4 homepage_promo
Used in the Homepage Spotlight placement

Recommended: 1920×1080 or 1600×900

## 5. Optional Asset Types (Future Expansion)
These asset types are defined now so the model never needs rewriting:

### 5.1 logo
Square logo

Used in sponsor badges, admin dashboard

### 5.2 banner
Wide-format banner

Used in homepage or seasonal placements

### 5.3 square
Generic square creative

### 5.4 wide
Generic wide creative

### 5.5 360_promo (optional)
360° panoramic image

Used for immersive placements or VR surfaces

Recommended: equirectangular 2:1 ratio (e.g., 4096×2048)

Must be ADA-compliant (fallback still required)

## 6. 360° Creative Assets (Optional, VR‑Ready)
Electrum supports 360° assets as an optional creative type, but does not require sponsors to use them.

### 6.1 Why 360° assets exist in the model
Electrum’s brand identity is spatial, immersive, and civic

Electrum’s future includes VR apps (you’re already an Apple Developer)

Sponsors may want immersive placements for premium tiers

360° assets allow Electrum to demonstrate its spatial brand without forcing sponsors to adopt it

### 6.2 EMPTY

### 6.3 EMPTY

### 6.4 MVP rule
Define the asset type now.
Render it later.



## 7. Asset Validation Rules
### 7.1 Required
Must match allowed asset_type

Must be stored in correct folder

Must include alt text

Must be ADA-compliant

Must not contain political content

Must not contain flashing animations

### 7.2 Optional
Dimensions

Tagline

Sponsor link

## 8. Fallback Logic
If an asset is missing or invalid:

Public visitors:
• render nothing
• preserve layout spacing
• do not show placeholders
• do not show broken images

Preview mode (?preview=1):
• render Electrum placeholder
• include “Preview Only” badge


## 9. Summary
The Creative Assets Model:

Supports Story, Object, Timeline placements

Supports future Homepage, Map, Games, Quiz, Crosswords

Supports 360° assets without requiring them

Supports VR expansion

Requires no backend rewrites
