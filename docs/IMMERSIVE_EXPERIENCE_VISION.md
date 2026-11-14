# IMMERSIVE_EXPERIENCE_VISION.md
Platform Vision & User Experience Specification  
Electrum Civic Atlas  
Authoritative Reference derived from the Immersive Prototype

---

## 1. Executive Summary & Fundamental Experience

Electrum is not a digital encyclopedia, a directory of landmarks, nor a generic street-view camera. 

Electrum is a cinematic spatial memory atlas. Its fundamental mission is to anchor collective civic history in visceral physical space. It transforms civic memory from passive archival text into a living, navigable geography where a visitor can stand at the exact threshold of a city's pivotal moments, look toward the horizon, and perceive the architectural, cultural, and human forces that shaped that ground.

The Feeling of Electrum
When a visitor opens Electrum, they do not arrive at a search query box or an index of text links. They arrive at a portal. 
- The atmosphere is nocturnal, quiet, and reverent: deep night-blue ink (`#0e1726`), refined museum-grade typography (the geometric authority of Syne, the editorial grace of Cormorant Garamond, and the legibility of Manrope), punctuated by warm, luminous gold accents.
- The horizon moves with gentle, hypnotic autonomy (a slow 3° per second pan), establishing immediate spatial reality.
- The visitor feels like an observer standing at the nexus of past and present—grounded in the physical texture of the city while equipped with a celestial compass and radial codex to traverse time and space.

---

## 2. The Core Spatial Paradigm: The Dual-Register Model

Neither "360-First with Fallback" nor "2D-First with Optional 360"
Electrum operates on a distinct third model: the Bifocal Dual-Register Paradigm (The Spatial Stage & Curatorial Record).

### 1. Why it is not "360-first with 2D fallback":  
   In a traditional virtual tour or WebXR viewer, 2D editorial content is reduced to secondary popup modals or tooltips floating inside a 3D bubble. In Electrum, civic memory requires serious editorial rigor—long-form narrative journalism, archival citations, mini-timelines, contributor attributions, and community stewardship. The editorial register is never treated as a mere popover.
### 2. Why it is not "2D-first with optional 360 embed":  
   In standard encyclopedias or web CMS platforms, a 360° panorama is an optional media widget embedded in an iframe halfway down an article. In Electrum, spatial immersion is the primary lens of perception. The panorama is not an illustration; it is the ground truth of the object.

The Two Harmonized Registers
- The Spatial Register (The Stage): Provides instant presence, scale, orientation, geographic relationship, and discovery through panoramic visual sightlines. It answers: "Where am I, what does this place feel like, and what stands around me?"
- The Curatorial Register (The Record): Provides depth, forensic detail, temporal sequencing, narrative arcs, and relational causality. It answers: "Why does this matter, what happened here, who lived through it, and how does it connect to the rest of the city?"

The Role of 360° Imagery vs. Conventional Images
| Dimension | 360° Equirectangular Imagery | Conventional 2D Archival Images |
| :--- | :--- | :--- |
| Primary Function | Presence, context, spatial orientation, sightline discovery | Archival evidence, temporal contrast, tactile forensic detail |
| Viewpoint | Human-scale observer standing in the environment | Curated frame, historic snapshot, artifact close-up |
| Temporal Role | Primarily the contemporary stage (or reconstructed historic environment) | Archival photographs (e.g., 1885 construction, 1989 collapse) |
| Interaction | Dynamic exploration: drag, pitch lock, compass orientation, hotspot traversal | Scrutiny, zoom, caption reading, editorial pull quotes |
| Placement | Hero viewport (above the fold) anchoring the top of every major civic object | Curatorial body, gallery grids, related object cards, story sidebars |

---

## 3. Civic Object Taxonomy & Page Behaviors

Every record in Electrum belongs to a unified civic ontology. Each object type balances the Spatial and Curatorial registers according to its nature:

### 1. Place (`civic_place`)
- Nature: A permanent or semi-permanent geographic locus with defined physical contours (e.g., Lake Merritt, Mandela Parkway).
- Appearance & Behavior:
  - Spatial Register: An expansive 360° view captured from a signature vantage point. Hotspots in the sky or landscape mark adjacent entities, surviving artifacts, and historical moments that occurred within view.
  - Curatorial Register: Precise geographic coordinates, municipal established date/era, historical boundary descriptions, a mini-timeline of transformations, and a grid of related stories and surviving artifacts.

### 2. Neighborhood (`civic_neighborhood`)
- Nature: A broad territorial, cultural, and demographic district (e.g., Prescott, Chinatown, Fruitvale).
- Appearance & Behavior:
  - Spatial Register: A street-level or elevated panorama capturing the distinct architectural fabric and density of the district.
  - Curatorial Register: Settlement dates, socio-economic and cultural evolution, connected institutions, and links to all constituent Places, Artifacts, and Stories situated within its borders.

### 3. Entity (`civic_entity`)
- Nature: An organized human institution, grassroots movement, community preservation group, or collective actor (e.g., Oakland Heritage Alliance, Brotherhood of Sleeping Car Porters).
- Appearance & Behavior:
  - Spatial Register: Anchored at the entity’s physical headquarters, historic founding site, or primary civic arena.
  - Curatorial Register: Founding era, mission statement, archival records of civic interventions, leadership, and a roster of physical artifacts and places stewarded or defended by the entity.

### 4. Event (`civic_event`)
- Nature: A recurring civic ritual, festival, or periodic gathering that defines the city's living culture (e.g., First Fridays, Juneteenth Festival).
- Appearance & Behavior:
  - Spatial Register: A high-energy panorama capturing the streetscape or gathering ground where the event takes place.
  - Curatorial Register: Schedule, cultural significance, neighborhood footprint, and links to participating artists, merchants, and historical antecedents.

### 5. Artifact (`civic_artifact`)
- Nature: A discrete physical survivor, architectural element, monument, plaque, or relic (e.g., A Victorian Façade on 9th Street, The Tribune Tower Clock).
- Appearance & Behavior:
  - Spatial Register: The panorama places the artifact in its contemporary environment, allowing the user to discover how the relic sits amid modern developments.
  - Curatorial Register: High-resolution forensic 2D photographs revealing architectural detail (e.g., bracketed cornices, spindlework porches), construction dates, material specifications, and links to the neighborhood and preserving entities.

### 6. Moment (`civic_moment`)
- Nature: A singular, bounded temporal rupture, turning point, or historical event (e.g., Cypress Structure Collapse — October 17, 1989).
- Appearance & Behavior:
  - Spatial Register: The panorama presents the present-day site of the rupture (e.g., the tranquil landscaped Mandela Parkway where the double-deck viaduct once stood). It functions as a spatial palimpsest: the user stands in today's quiet parkway while confronting the history of what stood and fell there.
  - Curatorial Register: Exact calendar date, hour, causal history, archival documentation of the disaster/breakthrough, immediate aftermath, and direct links to the physical reconstructions that followed.

### 7. Story (`civic_story`)
- Nature: A long-form, magazine-grade narrative linking multiple civic objects together into a coherent human drama (e.g., "The Houses That Survived the Freeway").
- Appearance & Behavior:
  - Editorial Prominence: Magazine layout featuring an evocative illustrated or photographic hero, dateline, contributor byline, pull quotes, and deep reading typography.
  - Integrated Spatial Context: Story pages can embed an inline 360° viewer within the flow or feature a dedicated right-rail / below-story civic card rack and mini-timeline connecting the narrative directly to the physical objects in the Atlas.

---

## 4. Immersive Entry & Navigation Mechanics

### How Visitors Enter Immersive Content
1. Ambient, Frictionless Grounding: Entry is automatic and immediate upon page load. Visitors do not click an "Explore in 3D" button to launch a heavy, blocking 3D engine. The panorama is already alive, rotating at 3°/s with a subtle vignette.
2. Natural Discovery: Movement begins with a single intuitive gesture—pointer drag, trackpad swipe, or keyboard arrow keys. The instant interaction occurs, auto-rotation seamlessly yields to user control.
3. Hardware-Specific Immersion (VR / AR): For visitors seeking full stereoscopic immersion, dedicated controls ("Enter in VR" with headset iconography) trigger WebXR spatial mode.

### Hotspot Mechanics: Anchoring Objects in Space
- Mathematical Grounding: Hotspots are anchored to the equirectangular sphere using normalized UV coordinates:
  - `pan_x` (0.0 to 1.0): Represents horizontal yaw ($0^\circ$ to $360^\circ$), wrapping continuously around the horizon.
  - `pan_y` (0.0 to 1.0): Represents vertical pitch ($0.0 = \text{zenith}$, $0.5 = \text{horizon}$, $1.0 = \text{nadir}$).
- Visual Presentation:
  - A concentrated gold core (`oklch(82% .13 85)`) encircled by an expanding, glowing pulse ring (`animate-ping-ring`).
  - An attached glassmorphic badge displaying the uppercase target type (`PLACE`, `ARTIFACT`, `STORY`, `MOMENT`) and the specific title.
- Behavior:
  - Hotspots react to proximity and camera heading, smoothly positioning themselves as the viewer pans.
  - Clicking a hotspot initiates a deliberate navigation event to the target object or panorama.

### Navigation Between Panoramas and Objects
Electrum supports three distinct layers of navigation:

```text
+-------------------------------------------------------------------------+
|                           THE GLOBAL CANOPY                             |
|          SiteHeader  |  Explore Lander  |  Search  |  Codex Overlay     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                           THE SPATIAL STAGE                             |
|    Hotspot Jump (In-Situ)   <------------->   Panorama Thumbnail Bar    |
|   (Walk through spatial nodes)                (Hop angles at same site) |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         THE CURATORIAL RECORD                           |
|        Connected Objects Card Grid  |  Mini-Timeline  |  Stories        |
+-------------------------------------------------------------------------+
```

1. In-Situ Spatial Navigation (Hotspot Portal Walk):  
   While looking through the panorama of a Neighborhood, a visitor spots an Artifact hotspot on a Victorian porch down the street. Clicking it transports the camera directly to that Artifact’s dedicated panorama and page, simulating walking through civic space.
2. Intra-Site Multi-Angle Navigation (Panorama Thumbs):  
   When a single civic place or artifact has multiple captures (e.g., aerial overview, interior sanctuary, street-level gateway, or historic recreation), a sleek thumbnail strip allows immediate switching of vantage points while keeping the curatorial context stable.
3. Curatorial Relational Traversal:  
   Below the stage, every object displays its network of connected nodes: clicking related objects, temporal eras, or stories preserves seamless mental continuity.
4. Systematic Codex Traversal:  
   The radial Codex overlay provides a 360-degree mental map of the entire civic taxonomy, allowing instant jumps across the eleven core dimensions of civic knowledge.

---

## 5. Graceful Degradation: When Immersive Media is Unavailable

In civic preservation, comprehensive 360° capture is not always immediately possible—especially for lost historical buildings, delicate artifacts, or newly created records.

### The Rule of Archival Dignity
Electrum never renders an empty black void, a broken icon, or an apologetic missing-media notice.

When a panorama is absent, unready, or unpublished:
1. Curatorial Elevation: The page gracefully shifts its hero emphasis to high-resolution 2D archival photography, historic cartography, architectural blueprints, or an illustrative scene.
2. Preserved Typographic Authority: The hero maintains its full proportion, displaying the title in Syne, the era metadata, and the civic badges without visual collapse.
3. Contextual Continuity: The search bar, mini-timeline, connected objects grid, and sponsorship modules remain in identical positions, ensuring the object retains first-class status in the Atlas.

---

## 6. Complete End-to-End User Journeys

Journey 1: The Serendipitous Spatial Explorer
1. Arrival: A visitor lands on `oakland1852.com`. The evening sky over Oakland rotates gently. The visitor spots the glowing gold spire of the Tribune Tower in the distance.
2. Spatial Engagement: The visitor drags the scene, following the skyline toward a pulsing gold hotspot labeled `PLACE: LAKE MERRITT`.
3. Portal Hop: Clicking the hotspot transitions to `/oakland/places/lake-merritt`. The viewer now stands at the water’s edge, viewing the Necklace of Lights.
4. Historical Curiosity: Beneath the viewer, the visitor glances at the mini-timeline: "Wildlife refuge since 1870". They notice a connected entity card: Oakland Heritage Alliance.
5. Narrative Deep Dive: At the base of the page, a featured story card beckons: "The Houses That Survived the Freeway". Clicking it transitions to the magazine reading experience, revealing the human drama behind the physical city.

Journey 2: The Curatorial Historian / Student
1. Search Entry: A student researching the 1989 Loma Prieta earthquake opens the site header search bar and types `"Cypress"`.
2. Search Discovery: Instant results display a gold-badged moment: `MOMENT: CYPRESS STRUCTURE COLLAPSE (1989)`.
3. Experiencing the Palimpsest: Landing on the page, the student sees a 360° view of Mandela Parkway today—trees, families, walking paths. 
4. Forensic Reconciliation: Reading the curatorial text below, they discover that this tranquil parkway occupies the exact footprint of the collapsed concrete double-decker freeway.
5. Relational Thread: The student clicks through to the surviving Victorian Façade artifact in Prescott, observing how historic homes endured in the shadow of urban renewal.

---

## 7. Architectural State & Feature Categorization

To maintain strict clarity between what exists today, what is specified as immediate target behavior, and what lies on the platform roadmap, all features are classified below:

| Feature / Capability | Category | Description & Status |
| :--- | :--- | :--- |
| Equirectangular Panoramic Canvas | Current Implementation | Built & verified. Drag interaction, pitch lock ($\pm 14^\circ$), auto-rotate (3°/s), compass readout, responsive sizing. |
| Normalized UV Hotspots | Current Implementation | Built & verified. `pan_x` and `pan_y` mapped to yaw/pitch with real-time viewport clipping and pulsing gold rings. |
| Dual-Register Object Pages | Current Implementation | Built & verified for all 5 core types (Places, Neighborhoods, Entities, Moments, Artifacts) with mini-timelines and related grids. |
| Magazine-Grade Story Experience | Current Implementation | Built & verified. Multi-column editorial, pull quotes, datelines, and curatorial right-rail cards. |
| Museum Explore Lander | Current Implementation | Built & verified at `/oakland/explore` with bento portals, museum shelf, and large search field. |
| 11-Node Radial Codex | Current Implementation | Built & verified across all views, anchoring systematic navigation. |
| Strict Sponsorship Isolation | Current Implementation | Centralized in `resolveSponsorSlot`. Editorial integrity preserved; search and games are completely unsponsored. |
| Hotspot Tooltip vs. Direct-Jump Mechanics | Intended Behavior | Currently hotspots jump immediately; A/B testing framework planned to evaluate hovering detail cards vs. immediate page transitions. |
| Multi-Panorama Seamless Cross-Fading | Intended Behavior | Currently switching panoramas updates the background image instantaneously. |
| Interactive Spatial Audio Grounding | Intended Behavior | Panoramas designed to incorporate directional ambient soundscapes (e.g., lake winds, historic streetcars) linked to camera yaw. |
| WebXR / Headset Mode Activation | Intended Behavior | The "Enter in VR" action button is visually mounted in page settings; awaiting integration with full WebXR stereoscopic renderer. |
| 4D Temporal Slider (Then vs. Now) | Future Possibilities | Sliding between an archival 1880s panoramic plate and a 2026 drone panorama from the exact same spatial coordinates. |
| Community Memory Pinning | Future Possibilities | Authenticated civic contributors anchoring verified family photographs and oral histories directly onto panoramic coordinates. |
| Volumetric 3D Gaussian Splatting | Future Possibilities | Evolving from flat equirectangular projection spheres into walkable, six-degrees-of-freedom photorealistic neural reconstructions. |

---

## 8. Summary: The Soul of Electrum

Electrum proves that civic history is not an abstraction that lives inside dusty archives. It is an imprint upon the physical earth. By placing the visitor on that earth—surrounded by the light, the buildings, and the horizons of a city—and seamlessly connecting that presence to rigorous historical documentation, Electrum turns citizens into witnesses and cities into living atlases.

---

