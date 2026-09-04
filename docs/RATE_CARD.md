Compensation Rate Card (v1) 
Version: 1.0 Compatibility: DATA_MODEL.md · EDITORIAL_WORKFLOW.md · PUBLICATION_AND_PAYOUT.md 
Last Updated: 2026 09 03
1. Purpose
This document defines Electrum’s content tiers, gross costs, and payout splits for Contributors and Editors. The rate card is the authoritative source for calculating:
•	production_unit.gross_cost
•	production_unit.contributor_payout
•	production_unit.editor_payout
•	production_unit.net_city_cost (after sponsor credit)
City Admins select a tier for each story at publication time. Electrum sets all rates; City Admins cannot modify payout percentages.
2. Content Tiers
Electrum v1 supports three story tiers. Each tier corresponds to a level of research depth, editorial involvement, and civic value.
🟦 Standard Story
Short, straightforward civic content requiring minimal research.
Characteristics:
•	300–800 words
•	1–2 sources
•	No interviews
•	Quick turnaround
•	Light editorial shaping
Examples:
•	History of a landmark
•	Short neighborhood profile
•	Civic trivia or micro history
🟦 Feature Story
Longer, more developed civic content requiring moderate research.
Characteristics:
•	800–2,000 words
•	3–6 sources
•	Light interviews or quotes
•	Multi section narrative
•	Moderate editorial shaping
Examples:
•	Restoration story
•	Neighborhood evolution
•	Local cultural history
🟦 Investigation
Deep civic research requiring significant time and editorial oversight.
Characteristics:
•	2,000+ words
•	6+ sources
•	Multiple interviews
•	Archival or historical research
•	Complex narrative structure
•	High editorial involvement
Examples:
•	Major civic event reconstruction
•	Historical injustice analysis
•	Infrastructure or policy deep dive
3. Compensation Table (v1)
All values in USD cents.
Tier	Gross Cost	Contributor %	Editor %	Contributor Payout	Editor Payout
standard	5000¢ ($50.00)	60%	40%	3000¢ ($30.00)	2000¢ ($20.00)
feature	12000¢ ($120.00)	60%	40%	7200¢ ($72.00)	4800¢ ($48.00)
investigation	25000¢ ($250.00)	65%	35%	16250¢ ($162.50)	8750¢ ($87.50)
Invariant: gross_cost = contributor_payout + editor_payout
4. Sponsor Credit Interaction (v1)
Sponsor credit reduces city budget debit, not payee payouts.
Code
net_city_cost = gross_cost − sponsor_credit
Contributor and Editor payouts remain unchanged regardless of sponsor involvement.
5. Image Compensation (v1)
Images submitted by Contributors are treated as supporting assets for the story.
Rules:
•	Images do not receive separate compensation.
•	Images are covered under the story’s tier rate.
•	Contributor retains copyright.
•	Electrum receives a perpetual, non exclusive license to publish and archive the images.
City Admins provide 360° images separately; these are not part of Contributor compensation.
6. Governance Rules
•	City Admins must select a tier before publishing a story.
•	Editors cannot select or modify tiers.
•	Contributors cannot select or modify tiers.
•	Tier selection may be changed only before publication.
•	Once a production_unit is created, tier and payouts are frozen.
7. Revision Policy
Rate card changes require:
1.	Approval from Electrum Platform Engineering
2.	Approval from Electrum Finance
3.	Update to corporate revenue model
4.	Update to Contributor and Editor agreements
5.	Update to this file (RATE_CARD.md)
Workspace reads this file to enforce payout logic; changes must be coordinated.
End of RATE_CARD.md Maintained by: Electrum Platform Engineering & Finance Review cycle: Quarterly or upon major rate changes

