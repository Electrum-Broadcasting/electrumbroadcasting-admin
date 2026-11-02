# **SPONSORSHIP_ELIGIBILITY_MODEL.md**  
### *Electrum Civic Atlas — Sponsorship Eligibility Specification*  
### *Version 1.0 (Governance‑Aligned, Compliance‑Ready)*

---

## **1. Overview**

Sponsor Eligibility ensures that only organizations meeting Electrum’s civic, ethical, and brand‑safety standards may activate sponsorship campaigns. Eligibility is a **hard gate**: a campaign cannot transition from `draft` to `active` unless all eligibility criteria are satisfied.

Eligibility protects:

- civic integrity  
- editorial independence  
- ADA compliance  
- brand safety  
- user trust  
- city‑level governance  
- sponsor accountability  

This document defines the eligibility criteria, validation workflow, enforcement mechanisms, and integration points with the Sponsorship Lifecycle.

---

## **2. Eligibility Criteria**

A sponsor must satisfy **all** of the following criteria to activate a campaign.

### **2.1 Brand Safety Status**
Represents whether the sponsor’s brand, messaging, and public presence meet Electrum’s safety standards.

**Field:** `brand_safety_status`  
**Type:** enum(`approved`, `rejected`, `pending`)  

**Rules:**
- `approved` → eligible  
- `pending` → cannot activate  
- `rejected` → cannot activate  

**Examples of violations:**
- political advertising  
- discriminatory content  
- harmful or misleading claims  
- adult content  
- unsafe imagery (flashing, violent, etc.)

---

### **2.2 Good Standing Status**
Represents whether the sponsor is in good financial, legal, and civic standing.

**Field:** `good_standing_status`  
**Type:** enum(`good`, `warning`, `revoked`)  

**Rules:**
- `good` → eligible  
- `warning` → cannot activate  
- `revoked` → cannot activate  

**Examples of violations:**
- unpaid invoices  
- legal disputes  
- revoked contracts  
- violations of Electrum’s civic guidelines  

---

### **2.3 Creative Asset Compliance**
All creative assets must meet Electrum’s standards.

**Requirements:**
- correct asset_type  
- correct dimensions  
- ADA‑compliant alt text  
- no flashing animations  
- no political content  
- no misleading claims  
- stored in correct folder structure  
- passes brand safety scan  

**Failure → campaign cannot activate**

---

### **2.4 City‑Level Approval**
Campaigns must be scoped to a single city.

**Field:** `city_id`  
**Rules:**
- city must exist  
- city must be active  
- city admin must not have revoked sponsorship privileges  

**Failure → campaign cannot activate**

---

### **2.5 Placement Completeness**
All required placements for the campaign must exist.

For MVP:

- Story placement  
- Object placement  
- Timeline placement  

**Failure → campaign cannot activate**

---

## **3. Eligibility Validation Workflow**

Eligibility is validated automatically during activation.

### **3.1 Validation Trigger**
Eligibility is checked when:

- sponsor uploads creative assets  
- sponsor edits profile  
- admin reviews sponsor  
- campaign activation is attempted  
- Workspace runs compliance checks  

### **3.2 Validation RPC**
Eligibility is enforced by:

```
rpc_validate_sponsor(campaign_id)
```

This RPC checks:

1. brand safety  
2. good standing  
3. creative asset compliance  
4. placement completeness  
5. city validity  

If any check fails, activation is blocked.

---

## **4. Enforcement Mechanisms**

### **4.1 RPC‑Only Activation**
Campaigns may only activate via:

```
rpc_activate_campaign
```

This RPC calls `rpc_validate_sponsor` internally.

### **4.2 Trigger Enforcement**
Even if someone tries to bypass RPCs:

- direct status updates are blocked  
- placement activation is blocked  
- creative rendering is blocked  

### **4.3 RLS Enforcement**
Eligibility checks respect RLS:

- CEO → full access  
- City Admin → read‑only for their city  
- Sponsor → full access to their own profile  
- Anonymous → no access  

### **4.4 Workspace Enforcement**
Workspace uses this spec to:

- show eligibility warnings  
- block activation buttons  
- display compliance checklists  
- require corrective actions  

---

## **5. Eligibility States**

Eligibility is not a single field; it is a composite of multiple statuses.

### **5.1 Eligible**
All criteria satisfied.  
Campaign may activate.

### **5.2 Ineligible (Pending)**
Brand safety or good standing is pending review.

### **5.3 Ineligible (Rejected)**
Brand safety or good standing is rejected.

### **5.4 Ineligible (Incomplete)**
Missing creative assets or placements.

### **5.5 Ineligible (City Blocked)**
City-level sponsorship privileges revoked.

---

## **6. Workspace Integration**

Workspace uses this model to:

### **6.1 Display Eligibility Checklist**
- Brand Safety  
- Good Standing  
- Creative Assets  
- Placement Completeness  
- City Approval  

### **6.2 Block Activation**
Activation button disabled until all criteria pass.

### **6.3 Provide Corrective Actions**
- Upload missing assets  
- Fix ADA compliance  
- Resolve brand safety issues  
- Resolve good standing issues  
- Contact city admin  

### **6.4 Show Eligibility History**
Audit trail of:

- approvals  
- rejections  
- warnings  
- revocations  

---

## **7. Future Expansion (No Rewrite Required)**

Eligibility can expand to include:

- political neutrality checks  
- environmental compliance  
- DEI compliance  
- financial credit checks  
- multi‑city approval workflows  
- seasonal brand safety rules  
- VR creative compliance  
- 360° asset safety checks  

No changes to the core model are required.

---

## **8. Summary**

The Sponsorship Eligibility Model:

- enforces civic integrity  
- protects Electrum’s brand  
- ensures ADA compliance  
- integrates with RPCs  
- integrates with triggers  
- integrates with RLS  
- integrates with Workspace  
- supports future expansion  
- requires no rewrites  

