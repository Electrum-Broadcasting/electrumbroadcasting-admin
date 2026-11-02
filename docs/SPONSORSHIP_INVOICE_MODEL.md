#SPONSORSHIP_INVOICE_MODEL.md
Electrum Civic Atlas — Sponsorship Pricing & Invoice Specification
Version 1.0 (Proforma‑Aligned, Expansion‑Safe)

## 1. Overview
The Sponsorship Invoice Model defines how Electrum calculates the cost of a sponsorship campaign using:

Tier Base Rates

Coverage Multipliers

Placement Multipliers

Promo Fees

Promo Rates

Add‑Ons

Seasonal Modules

Multi-content Modules

Future VR/360° premium tiers

This model is derived directly from Electrum’s proforma and is designed to be:

mathematically stable

governance‑aligned

expansion‑safe

compatible with MVP launch

compatible with future placement families

compatible with automated billing

## 2. Core Formula
All sponsorship invoices use the following formula:

Total
=
(
TierBaseRate
⋅
PlacementMultiplier
⋅
CoverageMultiplier
)
+
FlatAddOns
+
(
TierBaseRate
⋅
PercentAddOns
)
Where:

TierBaseRate = sponsor’s selected tier

PlacementMultiplier = sum of multipliers for selected placements

CoverageMultiplier = geographic scope multiplier

FlatAddOns = fixed-fee promotional modules

PercentAddOns = percentage-based promotional modules

This formula is additive, composable, and future‑proof.

## 3. Tier Base Rates
Tier	Rate
SponRate1	$50
SponRate2	$250
SponRate3	$600
SponRate4	$1,000
SponRate5	$2,000
SponRate6	$4,500
SponRate7	$10,000


Notes:

MVP sponsors typically fall between Tier 2–4.

Higher tiers unlock premium placements (future).

VR/360° placements may require Tier 5+.

## 4. Coverage Multipliers
Coverage	Multiplier
Single City	1.00
Multi City	1.50
Single State	2.00
Multi State	3.00
National	4.00
Global	5.00


MVP:  
Only Single City is active.

## 5. Placement Multipliers
Electrum supports multiple placement families.
MVP activates only Story, Object, and Timeline.

### 5.1 Story Placement
Type	Multiplier
StoryPlacementSingle	1.25
StoryPlacementCategory	2.00
StoryPlacementAllCity	3.00
StoryPlacementHomepage	4.00


### 5.2 Object Placement
Object placements follow Story multipliers unless overridden in future phases.

### 5.3 Timeline Placement
Type	Multiplier
TimelinePlacementSingle	1.50
TimelinePlacementCategory	2.50
TimelinePlacementAllCity	3.50
TimelinePlacementHomepage	4.50


## 6. Promo Fees (Flat Add‑Ons)
Flat fees added directly to invoice.

### 6.1 Quiz Promo Fees
Module	Fee
DiscCode	$25
PerfScoreReward	$50
LeaderboardReward	$75
SeasonalPromo	$100


### 6.2 Crossword Promo Fees
Same structure as Quiz.

### 6.3 Games Promo Fees
Same structure as Quiz.

### 6.4 Timeline Promo Fees
Same structure as Quiz.

### 6.5 Story Promo Fees
Same structure as Quiz.

### 6.6 Map Promo Fees
Same structure as Quiz.

### 6.7 Homepage Promo Fees
Module	Fee
DiscCode	$25
SeasonalCampaign	$50
CivicEvents	$75
SponsorAnnouncements	$100


## 7. Promo Rates (Percent Add‑Ons)
Percentage-based add-ons applied to Tier Base Rate.

### 7.1 Quiz Promo Rates
Module	Rate
Multicontent	10%
MapPromo	15%
StoryPromo	20%


### 7.2 Crossword Promo Rates
Same structure as Quiz.

### 7.3 Games Promo Rates
Same structure as Quiz.

### 7.4 Timeline Promo Rates
Same structure as Quiz.

### 7.5 Story Promo Rates
Same structure as Quiz.

### 7.6 Map Promo Rates
Same structure as Quiz.

### 7.7 Homepage Promo Rates
Module	Rate
PromoRibbon	10%
LinkToSponsor	15%
Analytics	20%


## 8. Add‑Ons (Flat + Percent)
Add‑Ons are optional modules that enhance sponsor visibility.

### 8.1 Flat Add‑Ons
Add‑On	Fee
DiscountCodes	$25
PerfScoreRewards	$50
LeaderboardRewards	$75
SeasonalPromo	$100


### 8.2 Percent Add‑Ons
Add‑On	Rate
MulticontentPromo	10%
MapPromo	15%
StoryPromo	20%


## 9. Example Invoice (From Your Proforma)
Tier Base Rate
Tier: SponRate2 → $250
Coverage: MultiCity → 1.50
Base Rate = $375

Placement Factor
StoryPlacementCategory → 2.00
Base Sponsorship = $375 × 2.00 = $750

Promo Fees
QuizPerfScoreReward → $50

Promo Rates
QuizMulticontent → 10%
GamesMapPromo → 15%
MapMulticontent → 10%
HomepageAnalytics → 20%
Total Promo Rate = 55%
Promo Rate Value = $250 × 0.55 = $137.50

Add‑Ons
DiscountCodes → $25
MulticontentPromo → 10% → $25
Total Add‑Ons = $50

Total Promo + Add‑Ons
$50 + $137.50 = $187.50

TOTAL AMOUNT DUE
$750 + $187.50 = $937.50

## 10. MVP Activation Rules
For launch:

Only Story, Object, Timeline placements are active

Only Single City coverage is active

Only TierBaseRate + PlacementMultiplier are used

Promo Fees disabled

Promo Rates disabled

Add‑Ons disabled

This ensures:

simple invoices

predictable pricing

no rewrites later

full compatibility with your backend

## 11. Future Expansion (No Rewrite Required)
The invoice model supports:

multi-city campaigns

multi-state campaigns

national/global campaigns

homepage placements

map placements

games placements

quiz placements

crossword placements

seasonal promotions

VR/360° premium tiers

dynamic pricing

sponsor-specific discounts

city-level overrides

No changes to the core formula are required.

## 12. Summary
The Sponsorship Invoice Model:

fully encodes your proforma

supports MVP launch

supports future expansion

integrates with placements

integrates with creative assets

integrates with eligibility

integrates with RPC lifecycle

integrates with Workspace billing

requires no rewrites