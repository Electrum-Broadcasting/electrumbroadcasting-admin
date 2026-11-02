# **SPONSORSHIP_RENDERING_GUIDE.md**  
### *Electrum Civic Atlas — Sponsorship Rendering Specification*  
### *Version 1.0 (Lovable‑Ready, MVP‑Scoped)*

---

## **1. Purpose**

This guide instructs Lovable how to render Sponsorship placements on:

- Story Pages  
- Object Pages  
- Timeline Pages  

It defines:

- placement locations  
- slot names  
- rendering rules  
- creative asset requirements  
- fallback behavior (Electrum placeholders only)  
- ADA compliance  
- responsive behavior  

This guide is **only** for UI rendering.  Electrum never shows placeholders to public visitors. Placeholders are strictly for preview mode (?preview=1) to support design scaffolding and admin review.

Governance, billing, eligibility, and lifecycle are handled by Workspace.

---

## **2. Rendering Principles**

Lovable must follow these principles:

### **2.1 Sponsor creative is required**
Sponsors **must** upload creative assets to activate a campaign.  
Electrum placeholders are used **only** when:

- previewing placements  
- rendering inactive/draft campaigns  
- showing empty slots in Lovable’s design phase  

### **2.2 Placement rendering is non‑intrusive**
Sponsor modules must:

- never obscure editorial content  
- never interrupt reading flow  
- never distort page layout  
- never break ADA compliance  

### **2.3 Placement rendering is governed**
Lovable renders placements **only** when:

- `is_active = true`  
- creative asset exists  
- asset_type matches the mapping defined in SPONSORSHIP_PLACEMENT_MODEL.md §6.4

### **2.4 Electrum placeholders are allowed**
Placeholders must only appear in preview mode (?preview=1).

Public visitors:
• render nothing when creative is missing

Preview mode:
• render Electrum placeholder
• include “Preview Only” badge

## **3. Placement Surfaces (MVP)**

Lovable must support three placement surfaces:

1. **Story Page** → `story_promo`  
2. **Object Page** → `object_promo`  
3. **Timeline Page** → `timeline_promo`  

Each surface has a defined slot location and rendering behavior.

---

# **4. Story Page Rendering — `story_promo`**

### **4.1 Slot Location**
Lovable must render the Story Promo Module in **one** of two governed locations:

#### **Option A — Right Rail (Preferred)**
- Appears beside the story body  
- Scrolls independently  
- Does not interrupt reading flow  
- Ideal for desktop/tablet  

#### **Option B — Footer Placement (Mobile Fallback)**
- Appears below the story body  
- Full‑width card  
- ADA‑compliant spacing  

Lovable should implement both and switch responsively.

---

### **4.2 Rendering Rules**
The Story Promo Module must include:

- sponsor creative asset (`story_promo`)  
- sponsor name  
- sponsor logo when available
- “Sponsored” badge  
- Electrum card styling (rounded corners, soft shadow, civic palette)

### **4.3 Creative Requirements**
- asset_type = `story_promo`  
- recommended dimensions: 1200×600 or 800×800  
- ADA‑compliant alt text required  

### **4.4 Placeholder Behavior**
Placeholders must only appear in preview mode (?preview=1).

Public visitors:
• render nothing when creative is missing

Preview mode:
• render Electrum placeholder
• include “Preview Only” badge

# **5. Object Page Rendering — `object_promo`**

### **5.1 Slot Location**
Lovable must render the Object Promo Module:

#### **Below the Fold (Preferred)**
- appears after the primary object description  
- does not interrupt architectural or historical content  

#### **Right Rail (Desktop Fallback)**
- same behavior as Story Page right rail  

---

### **5.2 Rendering Rules**
The Object Promo Module must include:

- sponsor creative asset (`object_promo`)  
- sponsor name  
- sponsor logo when available
- “Sponsored” badge  
- Electrum object‑page styling (blueprint geometry, civic gold accents)

### **5.3 Creative Requirements**
- asset_type = `object_promo`  
- recommended dimensions: 1200×600 or 1600×900  
- ADA‑compliant alt text required  

### **5.4 Placeholder Behavior**
Placeholders must only appear in preview mode (?preview=1).

Public visitors:
• render nothing when creative is missing

Preview mode:
• render Electrum placeholder
• include “Preview Only” badge

# **6. Timeline Page Rendering — `timeline_promo`**

### **6.1 Slot Location**
Lovable must render the Timeline Promo Module:

#### **Inline Horizontal Banner (Preferred)**
- appears between timeline segments  
- full‑width  
- visually distinct but non‑intrusive  

#### **Footer Banner (Mobile Fallback)**
- appears below the timeline  
- full‑width  
- ADA‑compliant spacing  

---

### **6.2 Rendering Rules**
The Timeline Promo Module must include:

- sponsor creative asset (`timeline_promo`)  
- sponsor name  
- sponsor logo when available
- “Sponsored” badge  
- Electrum timeline styling (motion lines, chronological markers)

### **6.3 Creative Requirements**
- asset_type = `timeline_promo`  
- recommended dimensions: 1600×600 or 1920×720  
- ADA‑compliant alt text required  

### **6.4 Placeholder Behavior**
Placeholders must only appear in preview mode (?preview=1).

Public visitors:
• render nothing when creative is missing

Preview mode:
• render Electrum placeholder
• include “Preview Only” badge

# **7. Rendering Logic (Lovable)**

Lovable must follow this exact logic:

### **7.1 If campaign is active**
```
if is_active == true AND asset exists:
    render sponsor creative
else:
    render nothing
```

### **7.2 If campaign is draft**
```
render Electrum placeholder
```

### **7.3 If campaign is expired or terminated**
```
render nothing
```

### **7.4 If sponsor creative is missing**
Placeholders must only appear in preview mode (?preview=1).

Public visitors:
• render nothing when creative is missing

Preview mode:
• render Electrum placeholder
• include “Preview Only” badge

### **7.5 If asset_type mismatches slot**
```
render nothing
```

---

# **8. ADA Compliance Requirements**

Lovable must ensure:

- alt text is always present  
- contrast meets WCAG AA  
- sponsor badge is readable  
- no flashing animations  
- no auto‑playing video  
- 360° placeholders are static images  

---

# **9. Responsive Behavior**

Lovable must ensure:

- desktop → right rail or inline  
- tablet → inline or footer  
- mobile → footer only  
- VR (future) → 360° immersive surface  

---

# **10. Summary**

Lovable must:

- render sponsor creative only when active  
- use Electrum placeholders only for previews  
- place modules in governed locations  
- maintain ADA compliance  
- maintain editorial independence  
- maintain responsive behavior  
- follow slot_name and asset_type strictly  
