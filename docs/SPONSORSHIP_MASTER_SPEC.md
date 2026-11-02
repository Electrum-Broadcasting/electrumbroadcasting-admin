# **SPONSORSHIP_MASTER_SPEC.md**  
### *Electrum Civic Atlas — Unified Sponsorship Specification*  
### *Version 1.0 (Complete, Governed, Launch‑Ready)*

---

## **1. Overview**

The Electrum Sponsorship System is a governed, non‑programmatic, ADA‑compliant, brand‑safe mechanism for displaying sponsor content across Story Pages, Object Pages, Timeline Pages, and future civic surfaces. Sponsorship provides mission‑aligned revenue while preserving editorial independence and political neutrality.

This Master Specification unifies all Sponsorship subsystems:

- Data Model  
- Placement Model  
- Creative Asset Model  
- Eligibility Model  
- Workflow Model  
- Billing Workflow  
- Admin Dashboard Model  
- Pricing & Invoice Model  
- Governance & RLS Model  
- Terms & Conditions Integration  
- Sponsorship Policy Integration  

This document is the canonical reference for Electrum’s Sponsorship architecture.

---

## **2. Core Entities**

### **2.1 Sponsor Profiles**
Defines sponsor identity, brand safety status, good standing, and website metadata.

### **2.2 Sponsorship Campaigns**
Defines campaign lifecycle, city scope, start/end dates, and governance rules.

### **2.3 Sponsorship Placements**
Defines placement surfaces (Story, Object, Timeline, future families), slot names, and activation logic.

### **2.4 Creative Assets**
Defines sponsor-provided media, asset types, storage paths, ADA compliance, and brand safety rules.

---

## **3. Placement Families**

### **MVP Active Families**
- Story Page (`story_promo`)  
- Object Page (`object_promo`)  
- Timeline Page (`timeline_promo`)  

### **Future Families**
- Homepage  
- Maps  
- Games (Quiz, Crossword, All Games)  
- Citywide  
- Add‑On Modules  
- Seasonal Modules  
- VR/360° immersive placements  

---

## **4. Creative Asset Types**

### **Launch Types**
- story_promo  
- object_promo  
- timeline_promo  

### **Future Types**
- logo  
- banner  
- square  
- wide  
- 360_promo (VR-ready)  

**Storage Path Convention:**
```
sponsorships/{sponsor_id}/campaigns/{campaign_id}/{filename}
```

---

## **5. Eligibility Model**

A campaign may activate only if:

- brand_safety_status = approved  
- good_standing_status = good  
- creative assets compliant  
- placements complete  
- city valid  
- payment verified  

Eligibility is enforced by:

```
rpc_validate_sponsor
```

---

## **6. Lifecycle Model**

### **States**
- draft  
- active  
- expired  
- terminated (CEO-only)  

### **Governance**
Status changes may only occur via:

- `rpc_activate_campaign`  
- `rpc_expire_campaign`  
- `rpc_terminate_campaign`  

Direct updates are blocked by triggers.

### **Placement Sync**
Activation → placements active  
Expiration/Termination → placements inactive  

---

## **7. Billing Workflow**

Payment gating is mandatory.

### **Activation Requires:**
- invoice generated  
- payment received  
- payment verified  
- eligibility passed  

Placements **never** appear until payment is verified.

### **Refund Rules**
- Allowed only before activation  
- No refunds after campaign start  
- Termination for cause → no refund  

---

## **8. Pricing & Invoice Model**

Electrum uses the following formula:

\[
\text{Total} = (\text{TierBaseRate} \cdot \text{PlacementMultiplier} \cdot \text{CoverageMultiplier}) + \text{FlatAddOns} + (\text{TierBaseRate} \cdot \text{PercentAddOns})
\]

### **Launch Scope**
Only TierBaseRate + PlacementMultiplier + CoverageMultiplier are active.

Add‑Ons, Promo Fees, and Promo Rates are disabled for MVP.

---

## **9. Admin Dashboard Model**

### **Panels**
- Campaign List  
- Campaign Detail  
- Creative Asset Manager  
- Placement Preview Panel  
- Eligibility Panel  
- Billing Panel  
- Lifecycle Control Panel  
- Audit Log  

### **Role Permissions**
- Sponsor → create, upload, activate (if eligible)  
- City Admin → read-only  
- CEO → full control  

---

## **10. Governance & RLS Model**

### **RLS Rules**
- CEO → full access  
- Sponsor → own campaigns only  
- City Admin → campaigns in their city  
- Anonymous → no access  

### **Governance Principles**
- editorial independence  
- political neutrality  
- brand safety  
- ADA compliance  
- civic integrity  

---

## **11. Terms & Conditions Integration**

The Sponsorship T&C governs:

- sponsor responsibilities  
- creative asset requirements  
- political neutrality  
- human rights alignment  
- termination rights  
- liability & indemnification  
- non-exclusivity  
- amendment protocol  

This Master Spec aligns with all T&C clauses.

---

## **12. Sponsorship Policy Integration**

The Sponsorship Policy defines:

- eligibility rules  
- placement definitions  
- exclusivity rules  
- promo module rules  
- duration rules  
- creative restrictions  
- refund/cancellation rules  
- sponsor conduct expectations  

This Master Spec incorporates all policy requirements.

---

## **13. Future Expansion (No Rewrite Required)**

The architecture supports:

- multi-city campaigns  
- multi-state campaigns  
- national/global campaigns  
- homepage placements  
- map placements  
- games placements  
- quiz placements  
- crossword placements  
- seasonal promotions  
- VR/360° immersive placements  
- dynamic pricing  
- subscription models  
- recurring billing  
- sponsor credit accounts  

No changes to the core model are required.

---

## **14. Summary**

The Sponsorship Master Specification:

- unifies all Sponsorship subsystems  
- provides a single source of truth  
- is governance-aligned  
- is Workspace-ready  
- is Lovable-ready  
- is launch-ready  
- is expansion-safe  
- requires no rewrites  

