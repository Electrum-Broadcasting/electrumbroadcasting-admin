# **HOMEPAGE_SPONSORSHIP_PLACEMENT_MODEL.md**  
### *Electrum Civic Atlas — Homepage Sponsorship Placement Specification*  
### *Version 1.0 (Premium, Governed, Homepage‑Redesign‑Ready)*

---

## **1. Purpose**

The Homepage Sponsorship Placement defines a **premium, governed, high‑visibility** promotional surface on the Electrum homepage. This placement is designed to:

- preserve Electrum’s civic aesthetic  
- maintain editorial independence  
- avoid visual intrusion  
- provide meaningful sponsor value  
- support future homepage modularity  
- integrate with the Sponsorship lifecycle  
- integrate with ADA compliance  
- integrate with Workspace governance  

This is Electrum’s highest‑value placement.

---

## **2. Placement Definition**

### **Placement Name**
`homepage_spotlight`

### **Placement Family**
Homepage → Premium Tier

### **Slot Name**
`homepage_spotlight_tile`

### **Page Type**
`homepage`

### **Asset Type**
`homepage_promo`  
(Future-ready; sponsors must upload this creative.)

### **Placement Behavior**
- Appears as a **single tile** in a governed location  
- Uses Electrum’s civic card styling  
- Includes sponsor creative, sponsor name, optional logo, and “Sponsored” badge
- Never interrupts editorial content  
- Never replaces editorial modules  
- Never appears without sponsor creative  

---

## **3. Homepage Layout Integration**

The homepage must be redesigned to include a **modular sponsorship tile** placed in a governed, visually balanced location.

### **3.1 Placement Location (Final)**
**Between the Hero and Featured Stories**

This location is:

- high visibility  
- editorially neutral  
- visually balanced  
- ADA-friendly  
- sponsor-valuable  
- consistent with Electrum’s civic identity  

### **3.2 Tile Dimensions**
Matches the size of a Featured Story tile:

- 16:9 or 4:3 responsive card  
- ~360–420px tall on desktop  
- full-width on mobile  
- grid-aligned with other homepage modules  

### **3.3 Tile Styling**
Electrum civic styling:

- soft gold accent lines  
- teal/charcoal palette  
- rounded corners  
- subtle geometric overlays  
- ADA-compliant contrast  
- “Sponsored” badge in top-left corner  

---

## **4. Rendering Rules**

Lovable must follow these rules exactly:

### **4.1 Sponsor Creative Required**
Homepage sponsorship **never** uses placeholders.

If sponsor creative is missing:

```
render nothing
preserve layout spacing
```

### **4.2 Activation Logic**
Render homepage spotlight only when:

```
campaign.status = active
placement.is_active = true
creative.asset_type = homepage_promo
creative exists
```

### **4.3 Draft Campaigns**
Draft homepage campaigns **never** render on the homepage.

### **4.4 Expired or Terminated**
Render nothing.

### **4.5 Mismatched Asset Type**
Render nothing.

---

## **5. Creative Requirements**

Sponsors must upload:

- `homepage_promo` asset  
- recommended dimensions: 1920×1080 or 1600×900  
- ADA-compliant alt text  
- no flashing animations  
- no political content  
- no misleading claims  
- no editorial influence  

Electrum may decline or remove creative that violates guidelines.

---

## **6. Responsive Behavior**

### **Desktop**
- Tile appears in homepage grid between Hero and Featured Stories  
- Aligns with story tiles  
- Maintains visual balance  

### **Tablet**
- Tile scales to grid width  
- Maintains spacing  

### **Mobile**
- Tile becomes full-width  
- Appears below Hero  
- Above Featured Stories  

---

## **7. Governance Rules**

### **7.1 Premium Tier**
Homepage Spotlight is available only to sponsors meeting:

- brand safety = approved  
- good standing = good  
- homepage eligibility review  

### **7.2 Limited Slots**
Only **one** homepage spotlight tile may appear at a time.

Future versions may support:

- rotation  
- queueing  
- seasonal homepage modules  

### **7.3 Editorial Independence**
Homepage sponsorship:

- cannot influence homepage content  
- cannot replace editorial modules  
- cannot override civic identity  

### **7.4 ADA Compliance**
Homepage tile must:

- include alt text  
- meet WCAG AA contrast  
- avoid flashing  
- avoid autoplay  

---

## **8. Placement Lifecycle**

Homepage placement follows the Sponsorship lifecycle:

### **Draft**
- Not visible  
- No placeholder  
- Sponsor uploads creative  

### **Active**
- Tile appears  
- Creative rendered  
- Sponsor link active  

### **Expired**
- Tile removed  
- Layout preserved  

### **Terminated**
- Tile removed  
- No reactivation  

---

## **9. Workspace Integration**

Workspace must:

- validate homepage eligibility  
- validate creative compliance  
- validate payment  
- validate brand safety  
- validate good standing  
- activate placement via RPC  
- enforce RLS rules  

---

## **10. Lovable Integration**

Lovable must:

- redesign homepage to include the spotlight tile  
- implement responsive behavior  
- implement rendering logic  
- implement ADA compliance  
- implement sponsor card styling  
- integrate with `resolveSponsorSlot()`  
- integrate with `<SponsorModule>`  

Homepage sponsorship must render **only** through these components.

---

## **11. Summary**

The Homepage Sponsorship Placement:

- defines Electrum’s premium sponsorship surface  
- preserves editorial integrity  
- maintains civic identity  
- supports ADA compliance  
- supports responsive design  
- integrates with lifecycle, governance, and billing  
- is ready for Lovable to implement  
- is ready for Workspace to govern  
- is expansion-safe  
