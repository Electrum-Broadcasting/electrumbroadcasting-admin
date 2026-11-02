---

# **SPONSORSHIP_BILLING_WORKFLOW.md**  
### *Electrum Civic Atlas — Sponsorship Billing & Payment Workflow*  
### *Version 1.0 (Governance‑Aligned, Payment‑Gated Activation)*

---

## **1. Overview**

The Sponsorship Billing Workflow defines how Electrum:

- calculates sponsorship fees  
- collects payment  
- verifies payment  
- gates activation until payment is received  
- handles refunds, cancellations, and terminations  
- integrates billing with campaign lifecycle  
- ensures placements never appear without full payment  

This workflow is consumed by Workspace, the Sponsorship Admin Dashboard, and the RPC lifecycle.

---

## **2. Billing Principles**

Electrum’s billing system follows five core principles:

### **2.1 Payment Required Before Activation**
No campaign may activate until **full payment is received and verified**.

### **2.2 No Partial Activation**
Placements do not appear until:

- invoice generated  
- payment received  
- payment verified  
- eligibility passed  
- activation RPC executed  

### **2.3 No Reporting Guarantee at Launch**
Billing is independent of analytics.

### **2.4 No Refunds After Campaign Start**
Refunds only apply **before** activation.

### **2.5 Governance Controls All Pricing Updates**
Pricing changes must go through Electrum’s governance process.

---

## **3. Billing Workflow Overview**

The billing workflow consists of **seven** governed steps:

1. **Campaign Draft Created**  
2. **Invoice Generated**  
3. **Payment Requested**  
4. **Payment Received**  
5. **Payment Verified**  
6. **Eligibility Validated**  
7. **Campaign Activated**  

Placements appear only after Step 7.

---

## **4. Step-by-Step Workflow**

---

### **4.1 Step 1 — Campaign Draft Created**

Triggered by:

- Sponsor creating a new campaign  
- CEO creating a new campaign  

Actions:

- Campaign created with `status = draft`  
- Placements created (Story, Object, Timeline for MVP)  
- Creative assets uploaded (optional at this stage)  
- Eligibility panel shows “Pending Billing”  

---

### **4.2 Step 2 — Invoice Generated**

Triggered by:

- Sponsor clicking “Generate Invoice”  
- Workspace auto-generating invoice on draft creation  

Invoice includes:

- Tier Base Rate  
- Coverage Multiplier  
- Placement Multipliers  
- Add‑Ons (if selected)  
- Promo Fees (if selected)  
- Promo Rates (if selected)  
- Total Amount Due  
- Payment Instructions  
- Payment Deadline  

Invoice is stored in:

```
billing_invoices
```

Fields:

- invoice_id  
- campaign_id  
- sponsor_id  
- amount_due  
- amount_paid  
- payment_status (unpaid, paid, verified, failed)  
- created_at  
- updated_at  

---

### **4.3 Step 3 — Payment Requested**

Sponsor receives:

- invoice  
- payment link  
- payment instructions  
- payment deadline  

Dashboard shows:

**Billing Status: Payment Required**

Campaign cannot activate.

---

### **4.4 Step 4 — Payment Received**

Payment processor notifies Electrum:

- payment received  
- amount  
- transaction_id  
- timestamp  

Workspace updates:

```
payment_status = 'paid'
amount_paid = amount_due
```

Campaign still cannot activate.

---

### **4.5 Step 5 — Payment Verified**

Electrum verifies:

- payment authenticity  
- payment amount  
- no chargeback flags  
- no fraud indicators  

Once verified:

```
payment_status = 'verified'
```

Dashboard shows:

**Billing Status: Verified**

Campaign still cannot activate until eligibility passes.

---

### **4.6 Step 6 — Eligibility Validated**

Eligibility checks:

- brand_safety_status = approved  
- good_standing_status = good  
- creative assets compliant  
- placements complete  
- city valid  

If eligibility fails:

- activation blocked  
- sponsor notified  
- corrective actions listed  

If eligibility passes:

Dashboard shows:

**Ready for Activation**

---

### **4.7 Step 7 — Campaign Activated**

Triggered by:

```
rpc_activate_campaign(campaign_id)
```

Activation requires:

- payment_status = verified  
- eligibility = passed  

Actions:

- campaign status → active  
- placements → is_active = true  
- creative assets rendered  
- sponsor notified  
- activation timestamp logged  

Placements now appear on:

- Story pages  
- Object pages  
- Timeline pages  

---

## **5. Refund Workflow**

Refunds are only allowed **before campaign activation**.

### **5.1 Refund Allowed**
- payment_status = verified  
- campaign_status = draft  

Refund actions:

- reverse payment  
- mark invoice as refunded  
- mark campaign as cancelled  

### **5.2 Refund Not Allowed**
Refunds are not allowed if:

- campaign_status = active  
- campaign_status = expired  
- campaign_status = terminated  

Electrum may issue discretionary refunds for:

- platform failure  
- placement failure  
- governance errors  

---

## **6. Cancellation Workflow**

### **6.1 Sponsor Cancellation (Before Activation)**
Sponsor may cancel before activation.

Actions:

- invoice refunded (if paid)  
- campaign deleted or archived  
- placements removed  

### **6.2 Sponsor Cancellation (After Activation)**
Sponsor may request cancellation, but:

- no refund  
- campaign moves to `expired`  
- placements deactivated  

---

## **7. Termination Workflow**

Termination is CEO-only.

### **7.1 Termination for Cause**
Reasons:

- reputational harm  
- political neutrality violation  
- content guideline violation  
- legal issues  
- extremist association  

Actions:

- campaign → terminated  
- placements → deactivated  
- no refund  

### **7.2 Termination Without Cause**
Electrum may terminate with written notice.

Refunds handled case-by-case.

---

## **8. Billing Integration Points**

Billing integrates with:

### **8.1 RPC Lifecycle**
Activation requires:

- payment verified  
- eligibility passed  

### **8.2 RLS**
Billing data visible only to:

- Sponsor (their own invoices)  
- City Admin (read-only)  
- CEO (full access)  

### **8.3 Admin Dashboard**
Billing panel shows:

- invoice  
- payment status  
- verification status  
- activation eligibility  

### **8.4 Workspace**
Workspace enforces:

- payment gating  
- eligibility gating  
- activation gating  

---

## **9. Future Expansion (No Rewrite Required)**

Billing supports future activation of:

- multi-city campaigns  
- multi-state campaigns  
- national/global campaigns  
- homepage placements  
- map placements  
- games placements  
- quiz placements  
- crossword placements  
- seasonal promotions  
- VR/360° premium tiers  
- dynamic pricing  
- subscription models  
- recurring billing  
- sponsor credit accounts  

No changes to the core workflow are required.

---

## **10. Summary**

The Sponsorship Billing Workflow:

- enforces payment-before-activation  
- integrates with eligibility  
- integrates with RPC lifecycle  
- integrates with placements  
- integrates with creative assets  
- integrates with Workspace  
- supports future expansion  
- requires no rewrites  

