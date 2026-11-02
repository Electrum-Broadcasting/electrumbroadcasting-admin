# **SPONSORSHIP_PLACEMENT_MODEL.md**  
### *Electrum Civic Atlas — Sponsorship Placement Specification*  
### *Version 1.0 (Launch‑Ready, Expansion‑Safe)*

---

## **1. Overview**

Sponsorship Placements define *where* sponsor content appears within Electrum’s civic interfaces. A placement is a governed, non‑programmatic slot on a Story Page, Object Page, Timeline Page, or other content surfaces. Placements are activated or deactivated automatically based on campaign lifecycle state.

This document defines:

- Placement types  
- Slot names  
- Rendering rules  
- Creative asset requirements  
- Activation/deactivation logic  
- City scoping  
- Future expansion pathways  

This specification is consumed by Lovable to render sponsorship placeholders in the UI.

---

## **2. Placement Entities**

### **2.1 Sponsorship Placement**
A placement represents a single sponsor slot on a specific content surface.

| Field | Type | Description |
|-------|------|-------------|
| placement_id | uuid | Primary key |
| campaign_id | uuid FK → sponsorship_campaigns | Campaign |
| city_id | uuid FK → cities | City scope |
| page_type | enum(story, object, timeline, games, homepage) | Content surface |
| page_id | uuid | Optional (for single‑story placements) |
| slot_name | text | UI slot identifier |
| is_active | boolean | Controlled by triggers |
| created_at | timestamptz | Audit |
| updated_at | timestamptz | Audit |

---

## **3. MVP Placement Scope (Launch)**

Electrum’s launch includes **four** placement types:

1. **Story Page Placement**  
2. **Object Page Placement**  
3. **Timeline Page Placement**
4. **Homepage Spotlight**

These are the only placements Lovable must render for MVP.

Other placement families remain dormant until future phases.

---

## **4. Placement Definitions (Launch)**

### **4.1 Story Page Placement**
**page_type:** `story`  
**slot_name:** `story_promo`  
**asset_type:** `story_promo`

**Description:**  
A sponsor module displayed on Story Pages.  
Appears in the right rail or footer depending on layout.  
Non‑intrusive, ADA‑compliant, and visually aligned with editorial content.

**Rendering Requirements:**  
- Sponsor name  
- Optional sponsor logo
- “Sponsored” badge
- Background color or card style consistent with Electrum’s civic design language  

**Fallback Behavior:**  
If no active placement exists for the city:  
- Render nothing  
- Preserve layout spacing  

---

### **4.2 Object Page Placement**
**page_type:** `object`  
**slot_name:** `object_promo`  
**asset_type:** `object_promo`

**Description:**  
A sponsor module displayed on Object Pages (buildings, landmarks, civic assets).  
Typically placed below the fold or in the right rail.

**Rendering Requirements:**  
Same as Story Page, but may use wider creative assets depending on layout.

**Fallback Behavior:**  
Same as Story Page.

---

### **4.3 Timeline Page Placement**
**page_type:** `timeline`  
**slot_name:** `timeline_promo`  
**asset_type:** `timeline_promo`

**Description:**  
A horizontal banner placement displayed on Timeline Pages.  
Supports wide-format creative assets.

**Rendering Requirements:**  
- Wide banner creative  
- Sponsor name  
- Optional sponsor logo
- “Sponsored” badge

**Fallback Behavior:**  
Same as Story Page.

---

### **4.4 Homepage Spotlight**
**page_type:** `homepage`
**slot_name:** `homepage_spotlight_tile`
**asset_type:** `homepage_promo`

Render the single active homepage creative between the homepage hero and featured
content. Include sponsor name, optional sponsor logo, and a “Sponsored” badge.
Do not render a placeholder when the creative is missing or invalid.

---

## **5. Placement Activation Logic**

Placements are activated or deactivated automatically based on campaign lifecycle.

### **5.1 Activation**
When a campaign transitions to `active`:

- All placements for that campaign set `is_active = true`
- Creative assets become visible in UI
- Lovable renders sponsor modules in the appropriate slots

### **5.2 Deactivation**
When a campaign transitions to `expired` or `terminated`:

- All placements set `is_active = false`
- Creative assets are hidden
- UI reverts to non-sponsored layout

### **5.3 Trigger Enforcement**
Placement activation/deactivation is governed by:

```
AFTER UPDATE OF status ON sponsorship_campaigns
```

This ensures:

- No direct updates  
- No accidental activation  
- No bypass of governance rules  

---

## **6. Placement Creation Rules**

### **6.1 When Placements Are Created**
Placements are created when a campaign is created (status = `draft`).

### **6.2 Required Fields**
- `campaign_id`  
- `city_id`  
- `page_type`  
- `slot_name`  

### **6.3 Optional Fields**
- `page_id` (for single-story sponsorship)  
- `asset_type` (inferred from page_type)

### **6.4 Creative Asset Mapping**
| page_type | asset_type |
|-----------|------------|
| story | story_promo |
| object | object_promo |
| timeline | timeline_promo |
| homepage | homepage_promo |

---

## **7. City Scoping**

Placements are scoped to a single city:

- City admins may view placements for their city only  
- Sponsors may view placements for their own campaigns only  
- CEO may view all placements  
- Anonymous users may not view placements  

This ensures civic integrity and prevents cross-city leakage.

---

## **8. Rendering Contract for Lovable**

Lovable must render sponsorship modules according to the following contract:

### **8.1 Input Data**
Lovable receives:

- `is_active`  
- `slot_name`  
- `asset_url`  
- `sponsor_name`  
- `sponsor_logo_url` (optional)
- `asset_type`  

### **8.2 Rendering Rules**
If `is_active = true`:

- Render sponsor module in the designated slot  
- Use creative asset matching `asset_type`  
- Apply Electrum’s civic card styling  
- Include “Sponsored” badge  
- Include sponsor name  

If `is_active = false`:

- Render nothing  
- Preserve layout spacing  

### **8.3 Accessibility**
All sponsor modules must:

- be ADA-compliant  
- include alt text  
- avoid flashing or distracting animations  
- avoid political content  

---

## **9. Future Placement Families (Expansion)**

The model supports future activation of:

- Homepage placements  
- Map placements  
- Games placements  
- Quiz placements  
- Crossword placements  
- Seasonal placements  
- Multi-content placements  
- Add-On modules  
- Promo modules  

These can be added without modifying the core placement schema.

---

## **10. Summary**

The Sponsorship Placement Model:

- Defines all placement types  
- Supports MVP launch (Story, Object, Timeline)  
- Integrates with creative assets  
- Integrates with campaign lifecycle  
- Integrates with RLS  
- Integrates with Lovable’s rendering engine  
- Supports future expansion without rewrites  
