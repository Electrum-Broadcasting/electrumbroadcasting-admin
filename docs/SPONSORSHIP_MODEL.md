# **SPONSORSHIP_MODEL.md**  
### *Electrum Civic Atlas — Sponsorship System Specification*  
### *Version 1.0 (Launch‑Ready, Expansion‑Safe)*

---

## **1. Overview**

The Electrum Sponsorship System enables governed, non‑programmatic brand sponsorship across Story Pages, Object Pages, Timeline Pages, and future content surfaces. Sponsorship provides a civic‑aligned funding mechanism that preserves editorial independence, ADA compliance, brand safety, and Good Standing requirements.

This document defines the **data model**, **entities**, **relationships**, and **governance rules** for the Sponsorship subsystem.

This specification supports:

- MVP placements (Story, Object, Timeline)  
- Full lifecycle (draft → active → expired → terminated)  
- Creative asset storage  
- Placement activation/deactivation  
- Sponsor eligibility  
- City‑scoped sponsorship  
- Future expansion (Add‑Ons, Promo Modules, Homepage, Maps, Games, Quiz, Crosswords, Coverage tiers)

---

## **2. Core Entities**

### **2.1 Sponsor Profiles**
Represents a sponsoring organization.

| Field | Type | Description |
|-------|------|-------------|
| sponsor_id | uuid | Primary key |
| name | text | Sponsor name |
| logo_url | text | Optional public logo |
| brand_safety_status | enum(approved, rejected, pending) | Required for activation |
| good_standing_status | enum(good, warning, revoked) | Required for activation |
| created_at | timestamptz | Audit |
| updated_at | timestamptz | Audit |

**Governance:**  
A sponsor must have `brand_safety_status = approved` AND `good_standing_status = good` to activate any campaign.

---

### **2.2 Sponsorship Campaigns**
Represents a sponsorship contract for a specific city and placement set.

| Field | Type | Description |
|-------|------|-------------|
| campaign_id | uuid | Primary key |
| sponsor_id | uuid FK → sponsor_profiles | Sponsor |
| city_id | uuid FK → cities | City scope |
| status | enum(draft, active, expired, terminated) | Lifecycle state |
| start_date | date | Optional |
| end_date | date | Optional |
| created_at | timestamptz | Audit |
| updated_at | timestamptz | Audit |

**Lifecycle Rules:**  
- `draft` → initial state  
- `active` → placements visible  
- `expired` → auto‑deactivated  
- `terminated` → CEO‑only terminal state  

**Governance:**  
Status changes may only occur via RPCs.  
Direct updates are blocked by `fn_block_direct_status_update`.

---

### **2.3 Sponsorship Placements**
Represents the placement of a campaign on a specific content surface.

| Field | Type | Description |
|-------|------|-------------|
| placement_id | uuid | Primary key |
| campaign_id | uuid FK → sponsorship_campaigns | Campaign |
| city_id | uuid FK → cities | City scope |
| page_type | enum(story, object, timeline, games, homepage) | Content surface |
| page_id | uuid | Optional (for single‑story placements) |
| slot_name | text | UI slot identifier (e.g., `story_promo`) |
| is_active | boolean | Controlled by triggers |
| created_at | timestamptz | Audit |
| updated_at | timestamptz | Audit |

**Activation Logic:**  
When a campaign becomes `active`, all associated placements set `is_active = true`.  
When a campaign becomes `expired` or `terminated`, placements set `is_active = false`.

This is enforced by AFTER UPDATE triggers.

**Placement Families:**  
MVP supports Story, Object, Timeline, and Homepage placements. Games placements remain inactive at launch.


---

### **2.4 Creative Assets**
Represents sponsor‑provided media used in placements.

| Field | Type | Description |
|-------|------|-------------|
| asset_id | uuid | Primary key |
| campaign_id | uuid FK → sponsorship_campaigns | Campaign |
| asset_type | enum(logo, banner, square, wide, story_promo, timeline_promo, object_promo, homepage_promo, 360_promo) | Rendering type |
| asset_url | text | Storage path |
| created_at | timestamptz | Audit |
| updated_at | timestamptz | Audit |

**Storage Path Convention:**  
```
sponsorships/{sponsor_id}/campaigns/{campaign_id}/{filename}
```

**360° Assets:**  
Electrum supports optional 360° panoramic assets (`asset_type = '360_promo'`) for future immersive and VR surfaces.  
These assets follow the same storage path convention and require no backend changes.


---

## **3. Relationships**

### **Sponsor → Campaigns**
- One sponsor may have many campaigns.
- A campaign belongs to exactly one sponsor.

### **Campaign → Placements**
- One campaign may have multiple placements.
- A placement belongs to exactly one campaign.

### **Campaign → Creative Assets**
- One campaign may have multiple creative assets.
- Assets are selected based on placement type.

### **City → Campaigns**
- Campaigns are scoped to a single city.
- City admins may view campaigns for their city only.

---

## **4. Lifecycle Model**

### **4.1 Draft**
- Campaign created  
- Placements created  
- Creative assets uploaded  
- Not visible to users  

### **4.2 Active**
- Sponsor eligibility validated  
- Placements activated  
- Creative assets rendered in UI  

Activation is only permitted if sponsor eligibility checks pass:  
- brand_safety_status = 'approved'  
- good_standing_status = 'good'  
- required creative assets uploaded  
- required placements present  

Eligibility is validated automatically by `rpc_validate_sponsor`.


### **4.3 Expired**
- Time‑based or manual expiration  
- Placements deactivated  
- Creative assets hidden  

### **4.4 Terminated (CEO‑only)**
- Immediate deactivation  
- Terminal state  
- Cannot be reactivated  

---

## **5. Governance Rules**

### **5.1 Status Update Governance**
Status changes may only occur via RPCs:

- `rpc_activate_campaign`  
- `rpc_expire_campaign`  
- `rpc_terminate_campaign`  

Direct updates are blocked by:

```
fn_block_direct_status_update
```

Bound as:

```
AFTER UPDATE OF status ON sponsorship_campaigns
```

### **5.2 Sponsor Eligibility**
A campaign may only activate if:

```
brand_safety_status = 'approved'
AND good_standing_status = 'good'
```

Enforced by:

```
rpc_validate_sponsor

```

Creative asset compliance and placement completeness are also required for activation.  
Missing or non‑compliant assets block activation.


### **5.3 Placement Sync**
Placement activation/deactivation is automatic and governed by triggers.

### **5.4 RLS**
- CEO: full access  
- City Admin: read‑only for their city  
- Sponsor: full access to their own campaigns  
- Anonymous: no access  

---

## **6. MVP Placement Scope (Launch)**

Only the following placements are enabled at launch:

### **Story Page**
- slot_name: `story_promo`
- asset_type: `story_promo`

### **Object Page**
- slot_name: `object_promo`
- asset_type: `object_promo`
Object placements follow the same rendering rules as Story placements but may use wider creative depending on layout.

### **Timeline Page**
- slot_name: `timeline_promo`
- asset_type: `timeline_promo`

All other placement families (Quiz, Crosswords, Games, Maps, Homepage) are disabled until future phases.

---

## **7. Pricing Model (Proforma Integration)**

The Sponsorship Engine uses the following formula:

\[
\text{Total} = (\text{TierBaseRate} \cdot \text{PlacementMultiplier} \cdot \text{CoverageMultiplier}) + \text{FlatAddOns} + (\text{TierBaseRate} \cdot \text{PercentAddOns})
\]

### **Launch Scope**
For MVP:

- TierBaseRate → enabled  
- CoverageMultiplier → enabled  
- PlacementMultiplier → enabled (Story, Object, Timeline only)  
- FlatAddOns → disabled  
- PercentAddOns → disabled  
- Promo Fees → disabled  
- Promo Rates → disabled  

This allows the full model to remain intact while only activating the minimal subset required for launch.

360° creative assets do not affect pricing and are treated as standard creative assets for MVP.

---

## **8. Future Expansion (No Rewrite Required)**

The model supports future activation of:

- Quiz placements  
- Crossword placements  
- Games placements  
- Map placements  
- Homepage placements  
- Add‑Ons  
- Promo Fees  
- Promo Rates  
- Multi‑city coverage  
- Multi‑state coverage  
- National and global coverage
- 360° immersive placements  
- VR sponsorship surfaces (VisionOS, WebXR, etc.)    

These features can be added without modifying the core schema or lifecycle.

---

## **9. Summary**

The Sponsorship Model is:

- **Launch‑ready**  
- **Governance‑aligned**  
- **UI‑ready for Lovable**  
- **Compatible with your existing backend**  
- **Expandable without rewrites**  
- **Aligned with your pricing proforma**  
- **Fully integrated with RLS and RPC lifecycle**  
