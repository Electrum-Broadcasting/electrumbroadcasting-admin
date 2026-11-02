# **SPONSORSHIP_ADMIN_DASHBOARD_MODEL.md**  
### *Electrum Civic Atlas — Sponsorship Admin Dashboard Specification*  
### *Version 1.0 (Governance‑Aligned, Workspace‑Ready)*

---

## **1. Overview**

The Sponsorship Admin Dashboard is the governed interface used by Sponsors, City Admins, and the CEO to manage sponsorship campaigns, creative assets, eligibility, and lifecycle transitions. It is not a public-facing UI; it is a compliance and workflow tool.

This specification defines:

- Dashboard structure  
- Role-based access  
- Campaign management workflows  
- Placement previews  
- Creative asset management  
- Eligibility gating  
- Lifecycle controls  
- Audit and compliance features  

This document is consumed primarily by Workspace.

---

## **2. Roles & Permissions**

The dashboard supports three roles:

### **2.1 Sponsor**
- Create campaigns  
- Upload creative assets  
- View eligibility status  
- View placement previews  
- Activate campaign (if eligible)  
- Expire campaign  
- Cannot terminate campaigns  
- Cannot view other sponsors’ campaigns  

### **2.2 City Admin**
- View campaigns scoped to their city  
- View placements  
- View creative assets  
- Cannot activate campaigns  
- Cannot expire campaigns  
- Cannot terminate campaigns  
- Cannot edit sponsor profiles  

### **2.3 CEO**
- Full access  
- Activate campaigns  
- Expire campaigns  
- Terminate campaigns  
- Override eligibility (rare)  
- View all cities and sponsors  

---

## **3. Dashboard Structure**

The dashboard consists of **five primary panels**:

1. **Campaign List**  
2. **Campaign Detail**  
3. **Creative Asset Manager**  
4. **Placement Preview Panel**  
5. **Eligibility Panel**

Each panel is described below.

---

## **4. Campaign List Panel**

Displays all campaigns visible to the current user.

### **Fields**
- Campaign Name  
- Sponsor Name  
- City  
- Status (draft, active, expired, terminated)  
- Start Date  
- End Date  
- Last Updated  

### **Actions**
- Create New Campaign (Sponsor only)  
- View Campaign  
- Filter by City (CEO only)  
- Filter by Sponsor (CEO only)  
- Filter by Status  

---

## **5. Campaign Detail Panel**

Displays full campaign information.

### **Sections**
- Campaign Metadata  
- Sponsor Profile Summary  
- City Scope  
- Lifecycle State  
- Eligibility Status  
- Creative Assets  
- Placements  
- Audit Log  

### **Actions (Sponsor)**
- Edit campaign metadata  
- Upload creative assets  
- Activate campaign (if eligible)  
- Expire campaign  

### **Actions (CEO)**
- All sponsor actions  
- Terminate campaign  
- Override eligibility (rare)  

### **Actions (City Admin)**
- View only  

---

## **6. Creative Asset Manager**

Allows sponsors to upload and manage creative assets.

### **Supported Asset Types (MVP)**
- story_promo  
- object_promo  
- timeline_promo  

### **Future Asset Types**
- logo  
- banner  
- square  
- wide  
- 360_promo  
- homepage assets  
- map assets  
- games assets  
- quiz assets  
- crossword assets  

### **Validation**
- Correct asset_type  
- Correct dimensions  
- ADA-compliant alt text  
- Brand safety scan  
- Correct storage path  

### **Actions**
- Upload asset  
- Replace asset  
- Delete asset  
- Preview asset  

---

## **7. Placement Preview Panel**

Shows how sponsorship will appear on Story, Object, and Timeline pages.

### **Placement Types (MVP)**
- Story Page → `story_promo`  
- Object Page → `object_promo`  
- Timeline Page → `timeline_promo`  

### **Preview Modes**
- Draft preview (placeholder)  
- Active preview (real creative assets)  
- Expired preview (hidden)  
- Terminated preview (hidden)  

### **Actions**
- None (read-only)  

---

## **8. Eligibility Panel**

Displays sponsor eligibility status.

### **Eligibility Criteria**
- Brand Safety Status  
- Good Standing Status  
- Creative Asset Compliance  
- Placement Completeness  
- City Approval  

### **Status Indicators**
- Eligible  
- Ineligible (Pending)  
- Ineligible (Rejected)  
- Ineligible (Incomplete)  
- Ineligible (City Blocked)  

### **Actions**
- None (Sponsor cannot override)  
- CEO may override in rare cases  

---

## **9. Lifecycle Control Panel**

Controls campaign lifecycle transitions.

### **Lifecycle States**
- draft  
- active  
- expired  
- terminated  

### **Actions (Sponsor)**
- Activate (if eligible)  
- Expire  

### **Actions (CEO)**
- Activate  
- Expire  
- Terminate  

### **Actions (City Admin)**
- None  

### **Governance**
All transitions use RPCs:

- `rpc_activate_campaign`  
- `rpc_expire_campaign`  
- `rpc_terminate_campaign`  

Direct updates are blocked.

---

## **10. Audit Log Panel**

Tracks all changes for compliance.

### **Logged Events**
- Campaign creation  
- Creative asset uploads  
- Eligibility changes  
- Lifecycle transitions  
- Placement activation/deactivation  
- CEO overrides  
- Sponsor profile changes  

### **Fields**
- Timestamp  
- Actor  
- Action  
- Metadata  

### **Actions**
- View log  
- Filter log  

---

## **11. Future Expansion (No Rewrite Required)**

The dashboard supports future activation of:

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
- VR sponsorship surfaces  
- 360° creative previews  

No changes to the core dashboard model are required.

---

## **12. Summary**

The Sponsorship Admin Dashboard Model:

- Defines all admin workflows  
- Enforces governance  
- Integrates with RPCs  
- Integrates with triggers  
- Integrates with RLS  
- Integrates with eligibility rules  
- Integrates with creative assets  
- Supports future expansion  
- Requires no rewrites  

