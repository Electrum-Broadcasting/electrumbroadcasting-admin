# **SPONSORSHIP_WORKFLOW.md**  
### *Electrum Civic Atlas — Sponsorship Workflow Specification*  
### *Version 1.0 (Governance‑Aligned, Launch‑Ready)*

---

## **1. Overview**

The Sponsorship Workflow defines the governed lifecycle of a sponsorship campaign from creation to termination. It ensures:

- brand safety  
- civic integrity  
- ADA compliance  
- sponsor eligibility  
- city scoping  
- placement activation/deactivation  
- creative asset readiness  
- non‑programmatic governance  
- RLS enforcement  
- RPC‑only status transitions  

This workflow is consumed by:

- the backend (RPCs, triggers, RLS)  
- the admin dashboard  
- Lovable’s rendering engine  
- future billing and invoicing modules  

---

## **2. Lifecycle States**

A sponsorship campaign moves through **four** governed states:

### **2.1 draft**
Initial state.  
Campaign is being prepared but not yet visible.

### **2.2 active**
Sponsor is eligible.  
Placements are visible.  
Creative assets are rendered.

### **2.3 expired**
Campaign has reached its end date or was manually expired.  
Placements are hidden.

### **2.4 terminated**
CEO‑only terminal state.  
Immediate deactivation.  
Cannot be reactivated.

---

## **3. State Transition Rules**

All state transitions must occur through RPCs.  
Direct updates are blocked by:

```
fn_block_direct_status_update
```

Bound as:

```
AFTER UPDATE OF status ON sponsorship_campaigns
```

This ensures governance integrity.

---

## **4. Workflow Steps**

### **4.1 Campaign Creation (draft)**

**Triggered by:**  
Sponsor or CEO creating a new campaign.

**Actions:**  
- Create campaign with `status = draft`  
- Create placements for Story, Object, Timeline  
- Upload creative assets (optional at this stage)  
- Validate sponsor eligibility (informational only)  

**UI (Lovable):**  
- Show “Draft” badge  
- Show placement preview placeholders  
- Show creative asset upload panel  
- Show eligibility checklist (brand safety + good standing)  

---

### **4.2 Sponsor Eligibility Validation**

Before activation, the system checks:

```
brand_safety_status = 'approved'
AND good_standing_status = 'good'
```

**Enforced by:**  
`rpc_validate_sponsor`

**UI ):**  
- Show eligibility checklist  
- Show warnings if not eligible  
- Disable “Activate Campaign” button until eligible  

---

### **4.3 Activation (active)**

**Triggered by:**  
`rpc_activate_campaign(campaign_id)`

**Actions:**  
- Set session variable: `app.allow_status_update = true`  
- Validate sponsor eligibility  
- Update campaign status → `active`  
- Trigger placement activation (`is_active = true`)  
- Render creative assets in UI  

**UI :**  
- Show “Active” badge  
- Show active placement previews  
- Show creative assets in Story/Object/Timeline pages  
- Show activation timestamp  

---

### **4.4 Expiration (expired)**

**Triggered by:**  
- End date reached  
- Manual expiration via admin  
- `rpc_expire_campaign(campaign_id)`

**Actions:**  
- Update campaign status → `expired`  
- Trigger placement deactivation (`is_active = false`)  
- Hide creative assets  

**UI (Lovable):**  
- Show “Expired” badge  
- Hide placement previews  
- Show expiration timestamp  

---

### **4.5 Termination (terminated)**

**Triggered by:**  
CEO only  
`rpc_terminate_campaign(campaign_id)`

**Actions:**  
- Update campaign status → `terminated`  
- Trigger placement deactivation (`is_active = false`)  
- Lock campaign from further changes  

**UI :**  
- Show “Terminated” badge  
- Disable all editing  
- Hide placement previews  
- Show termination timestamp  
- Show “This campaign is permanently closed” message  

---

## **5. Placement Workflow**

Placements follow the campaign lifecycle automatically.

### **5.1 Creation**
Created when campaign is created.

### **5.2 Activation**
When campaign becomes `active`:

```
is_active = true
```

### **5.3 Deactivation**
When campaign becomes `expired` or `terminated`:

```
is_active = false
```

### **5.4 Rendering**
Lovable renders placements only when:

```
is_active = true
```

---

## **6. Creative Asset Workflow**

### **6.1 Upload**
Sponsor uploads assets during draft.

### **6.2 Validation**
System checks:

- correct asset_type  
- correct dimensions  
- correct storage path  
- ADA compliance  
- brand safety  

### **6.3 Rendering**
Assets render only when:

- campaign is active  
- placement is active  
- asset_type matches the page/slot mapping in SPONSORSHIP_PLACEMENT_MODEL.md §6.4

### **6.4 Fallback**
If asset missing or invalid:

- render nothing  
- preserve layout spacing  

---

## **7. Governance Enforcement**

### **7.1 RPC‑Only Status Updates**
All status changes must use:

- `rpc_activate_campaign`  
- `rpc_expire_campaign`  
- `rpc_terminate_campaign`  

### **7.2 Trigger Enforcement**
Placement sync is enforced by triggers.

### **7.3 RLS Enforcement**
- CEO: full access  
- City Admin: read‑only for their city  
- Sponsor: full access to their own campaigns  
- Anonymous: no access  

### **7.4 Brand Safety**
Campaign cannot activate unless sponsor is approved.

### **7.5 Good Standing**
Campaign cannot activate unless sponsor is in good standing.

---

## **8. Admin Dashboard Workflow**

### **8.1 Draft View**
- Edit campaign details  
- Upload creative assets  
- View eligibility checklist  
- Preview placements  
- Activate button (disabled until eligible)  

### **8.2 Active View**
- Show active placements  
- Show creative assets  
- Show analytics (future)  
- Expire button  

### **8.3 Expired View**
- Show expired badge  
- Hide placements  
- Show expiration timestamp  
- Terminate button (CEO only)  

### **8.4 Terminated View**
- Show terminated badge  
- Disable all editing  
- Show termination timestamp  

---

## **9. Future Expansion (No Rewrite Required)**

The workflow supports future activation of:

- Homepage placements  
- Map placements  
- Games placements  
- Quiz placements  
- Crossword placements  
- Add‑Ons  
- Promo Modules  
- Seasonal placements  
- Multi‑city coverage  
- Multi‑state coverage  
- National/global coverage  
- 360° immersive placements  
- VR sponsorship surfaces  

No changes to the core workflow are required.

---

## **10. Summary**

The Sponsorship Workflow:

- Defines the full lifecycle  
- Enforces governance  
- Integrates with RPCs  
- Integrates with triggers  
- Integrates with RLS  
- Integrates with creative assets  
- Integrates with Lovable’s UI  
- Supports future expansion  
- Requires no rewrites  
