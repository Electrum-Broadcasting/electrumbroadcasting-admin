# MEDIA_PHILOSOPHY_AND_HIERARCHY.md
Electrum Civic Atlas — Visual Media Philosophy & Hierarchy Specification  
Authoritative Reference for Media Foundation, Panorama Foundation, and Hotspot Foundation  
Version: 1.0 · November 2026

---

## 1. Executive Summary & Media Philosophy

Electrum is not a digital encyclopedia, a directory of municipal landmarks, nor a generic street-view camera. It is a cinematic spatial memory atlas. Its foundational premise is that human memory, civic history, and collective identity are fundamentally anchored in physical geography.

In conventional digital publishing, municipal archives, and content management systems (such as Wikipedia or tourism portals), media operates merely as an illustrative thumbnail—a rectangular attachment floating alongside text. In Electrum, spatial presence is the primary epistemological anchor. Visitors do not merely read about an inflection point; they stand at the exact physical intersection, shoreline, or threshold where that history unfolded, enveloped by the horizon, orientation, light, and architectural scale of the living city.

This specification establishes the visual-media philosophy and asset hierarchy across all Electrum surfaces. It governs how immersive spatial media (360° equirectangular panoramas, spatial audio, and volumetric captures), contemporary 2D photography, and archival documentary artifacts interact, ensuring the platform retains its quiet civic gravitas without degrading into visual noise or technical friction.

---

## 2. Core Media Taxonomy & Distinct Roles

Electrum establishes three distinct strata of visual media, each carrying a non-interchangeable epistemic role:

```text
+--------------------------------------------------------------------------+
|                             ELECTRUM MEDIA STRATA                         |
+--------------------------------------------------------------------------+
| 1. SPATIAL STRATUM (360° Equirectangular / Dimensional Volumes)          |
|    - Embodiment & Presence: Grounds the citizen in physical geography    |
|    - Orientation & Scale: Horizon, cardinal compass, and urban fabric     |
|    - Interactive Scaffolding: Anchor surface for UV-coordinate Hotspots   |
+--------------------------------------------------------------------------+
| 2. EVIDENTIARY STRATUM (Archival Artifacts, Maps, Blueprints, Photos)    |
|    - Temporal Truth: Unfiltered historical record, primary testimony      |
|    - Temporal Comparison: Direct confrontation with current reality       |
|    - Micro-Inspection: Deep-zoom inspection of architectural documents    |
+--------------------------------------------------------------------------+
| 3. DOCUMENTARIAN STRATUM (Contemporary 2D Photography & Editorial Art)   |
|    - Human-Scale Intimacy: Architectural details, portraits, textures    |
|    - Narrative Pacing: Visual rhythm throughout editorial story layouts  |
|    - Lightweight Proxies: Performant cards, search results, bento tiles   |
+--------------------------------------------------------------------------+
```

### 2.1 The Role of Immersive Spatial Media (360°)
Immersive media provides presence, somatic grounding, and orientation. Its role is to simulate physical presence on the ground plane of specific civic coordinates.
- It establishes the environmental container for exploration.
- It provides a continuous 2:1 equirectangular sphere where cardinal headings (north, south, east, west), elevation, and sightlines convey how civic spaces relate to one another.
- It acts as the coordinate plane for spatial relationships: hotspots do not float in abstract UI space; they are fixed to real physical structures (a cornice, a transit line, a surviving Victorian façade) via normalized UV coordinates (`pan_x`, `pan_y`).

### 2.2 The Role of Conventional 2D Photographs
Contemporary 2D photographs provide editorial focus, compositional framing, and human-scale intimacy.
- Where 360° media is omnidirectional and non-directed (giving the user agency to look anywhere), 2D photography exercises curated editorial intent.
- It captures what a panoramic camera cannot: macro architectural details, human portraits, expressive lighting, fleeting atmospheric moments, and isolated material textures.
- It serves as the primary visual currency in linear reading environments where an omnidirectional viewer would disrupt cognitive immersion.

### 2.3 The Role of Historical Photographs, Maps, Blueprints, and Archival Illustrations
Archival media represents temporal evidence and forensic testimony.
- Archival photographs do not decorate pages; they serve as witnesses to what was erased, transformed, or contested.
- Historical maps, parcel plats, and architectural blueprints reveal the hidden infrastructure and urban planning decisions (e.g., freeway construction, redlining boundaries, creek culverting) that shaped the visible landscape.
- In Electrum, archival assets are explicitly contrasted against contemporary spatial views, creating a cognitive bridge across eras.

---

## 3. The Spatial Decision Engine: When to Use 360° vs. Static 2D

A primary failure mode in spatial applications is over-rotation: forcing full 360° viewers onto every object regardless of contextual fit. Electrum uses a strict decision engine to govern media format selection.

### 3.1 When 360° Media Must Be Preferred
360° media is mandatory or preferred when:
1. The spatial context is the subject: An urban intersection, public plaza, neighborhood vista, landscape summit, transit concourse, or historic district where understanding the 360-degree surrounding fabric is essential.
2. Multiple civic narratives intersect in one place: A vantage point from which a visitor can see three different historic buildings, a former streetcar right-of-way, and an altered shoreline.
3. Primary spatial landing and orientation: The city home page, the primary portal of an object detail page, or a narrative portal opening a major story.
4. Interactive hotspot navigation: Surfaces where the user looks around to discover secondary objects, artifacts, or branch into adjacent panoramas.

### 3.2 When Static 2D Media Must Be Preferred
Static 2D media is preferred when:
1. The primary objective is close inspection of a discrete object or artifact. Artifact pages may still employ a 360° spatial hero when the artifact's civic, architectural, or environmental context contributes meaning. The immersive hero provides context. Evidentiary media provides inspection.
2. The subject is a human entity or historical collective: An individual, political coalition, labor union, or family. These are represented through archival portraits, group photographs, or institutional seals.
3. Linear narrative reading: Inside the body of a long-form story. Inline 360° viewers in scrollable prose break reading cadence and hijack trackpad/touch scroll events.
4. Evidentiary micro-inspection: Detailed architectural blueprints, panoramic historical lithographs, and high-density maps where pan-and-zoom inspection of flat 2D detail is primary.
5. Fast-scan navigational surfaces: Search result lists, dense data tables, and mobile index feeds where immediate comprehension and rapid scrolling take precedence over environmental immersion.

### 3.3 Comparative Decision Matrix

| Dimension | Immersive Spatial Media (360°) | Static 2D Media (Archival / Photo) |
| :--- | :--- | :--- |
| Cognitive State | Exploration, discovery, presence, orientation | Reading, analysis, forensic inspection, reflection |
| User Agency | Autonomous yaw/pitch navigation, gaze direction | Curated viewing, guided compositional framing |
| Scroll Interaction | Interactive drag plane; requires scroll-isolation | Native passive document scroll; zero input collision |
| Asset Dimension | Strict 2:1 equirectangular (4096×2048 or 8192×4096) | Variable aspect ratios (16:9, 4:3, 1:1, 1.91:1) |
| Bandwidth & GPU | High (~10–50MB texture buffer, WebGL canvas) | Low to moderate (responsive srcset, progressive WebP) |
| Spatial Coordinates| UV normalized plane (`pan_x`, `pan_y` 0.0–1.0) | Standard pixel coordinates / localized bounding boxes |

---

## 4. Universal Fallback & Graceful Degradation Hierarchy

Immersive media requires specialized capture (equirectangular rigs, drone stitching, 360° cameras). Many historical places or ephemeral moments lack 360° coverage.

Electrum adheres to a Five-Tier Degradation Ladder. The UI must never display broken assets, empty black canvases, or generic placeholder wireframes in public view.

```text
+-------------------------------------------------------------------------+
|                      5-TIER DEGRADATION LADDER                          |
+-------------------------------------------------------------------------+
| Tier 1: Primary Published 360° Panorama                                  |
|         -> Full interactive WebGL sphere with UV hotspot overlay         |
+-------------------------------------------------------------------------+
| Tier 2: Curated High-Resolution 2D Editorial/Archival Hero               |
|         -> Static 16:9 hero with subtle slow ambient drift ("Ken Burns")|
|         -> Clear civic typography overlay; no broken 360° controls       |
+-------------------------------------------------------------------------+
| Tier 3: Parent / Territory 360° Panorama (Inheritance)                   |
|         -> If a Place lacks a 360°, inherit Neighborhood 360°           |
|         -> Viewer camera locked to the heading facing the Place coords   |
+-------------------------------------------------------------------------+
| Tier 4: Architectural Blueprint / Historical Map / Orthophoto Plate     |
|         -> Deep-zoom 2D canvas with cartographic grid styling            |
+-------------------------------------------------------------------------+
| Tier 5: Atmospheric Monogram / Civic Brand Gradient Fallback             |
|         -> Deep night-blue oklch(13% .02 240) with subtle gold grid     |
|         -> Architectural silhouette or city seal; zero generic placeholders|
+-------------------------------------------------------------------------+
```

### 4.1 Degradation Rules by Context
1. Public vs. Preview Separation:
   - In public production, missing media cascades seamlessly down the ladder. No "Asset Missing" or "Upload Here" text is ever shown to public citizens.
   - In City Admin Preview mode (`?preview=1`), a governed neutral Electrum placeholder with a subtle gold badge ("Preview Only") signals to curators that a spatial capture is required.
2. Layout Preservation:
   - Fallback states preserve exact container heights (e.g., 70vh hero) to prevent layout shifts (CLS).
   - If a 360° viewer degrades to a static 2D hero, rotation controls, pitch locks, and compass readouts gracefully hide; they are never rendered in a disabled or inert state over static media.
3. Hotspot Reprojection:
   - If a Place lacks its own published equirectangular 360° capture, it may inherit a published panorama from a parent civic object.
   - Inherited views require curator-defined camera orientation values (pan_x_initial, pan_y_initial).
   - Automatic geographic reprojection is not required.
   - The inherited panorama should orient the visitor toward the most relevant view of the child object.

---

## 5. Page-by-Page Surface Evaluation

This section evaluates all core Electrum surfaces across three temporal phases:
- Current Implementation: What exists in the verified prototype today.
- Intended Behavior: The designed production standard for the immediate platform roadmap.
- Future Possibilities: Long-range spatial computing, photogrammetry, and spatial audio directions.

---

### 5.1 Homepage (`/` or `/[citySlug]`)
- Primary Media Role: Atmospheric Gateway & Portal of Awe. Grounds the visitor immediately in the living city.
- Current Implementation: Full-width 70–80vh 360° hero view of Oakland at night; continuous 3°/s auto-rotation (pausable); pitch lock ±14°; drag/arrow controls; compass heading; 5 gold UV hotspot markers navigating to core entities; below-hero SearchBar and Homepage Spotlight sponsor tile.
- Intended Behavior: Multi-panorama time-of-day shifting (dawn, midday, twilight, night); seamless transition between historical panorama (1852) and contemporary panorama (present); direct hotspot activation with contextual mini-cards; instant reset-to-heading.
- Future Possibilities: Volumetric Gaussian splat hero; real-time weather and sunlight synchronization; spatial audio landscape (foghorns, train yards, urban birdlife, wind over the estuary).

---

### 5.2 Explore Lander (`/[citySlug]/explore`)
- Primary Media Role: Curatorial Bento & Architectural Discovery Shelf. Balances discovery across diverse civic categories.
- Current Implementation: Shared SiteHeader; title block with serif tagline; large central SearchBar; 10-tile curated bento grid with high-resolution 16:9/4:3 static imagery, gold accents, museum-style metadata; Civic Library Shelf with portrait cover tiles; preview modal triggers.
- Intended Behavior: Bento tiles feature "Portal Peeks"—resting as crisp static framing, but on sustained hover/focus smoothly cross-fading into a muted, micro-panning 360° sphere; clicking an immersive tile opens the 360° viewer directly; clear badge distinguishes spatial portals from editorial reading tiles.
- Future Possibilities: Interactive 3D miniature city model (isometric digital twin) acting as the bento navigation core; tactile material shaders (weathered paper, cast bronze, archival vellum).

---

### 5.3 Place Pages (`/[citySlug]/places/[slug]`)
- Primary Media Role: Geographic Landmark Immersion & Site Witnessing.
- Current Implementation: 60vh 360° panorama viewer as the hero; primary published panorama loaded; gold hotspot markers linked to internal objects; below-hero compact search bar; two-column metadata and description; connected items rail; mini-timeline; sponsorship module.
- Intended Behavior: Multi-panorama gallery switcher (e.g., Exterior Plaza, Main Rotunda, Rooftop Observation Deck); time-slider toggle to view the identical spatial coordinate across historical eras; precise cardinal compass anchored to true municipal coordinates.
- Future Possibilities: WebXR / Apple Vision Pro "Step Into Place" button; real-world AR anchor calibration via geolocation; LIDAR point-cloud overlay showing original structural dimensions of demolished wings.

---

### 5.4 Neighborhood Pages (`/[citySlug]/neighborhoods/[slug]`)
- Primary Media Role: Territorial Overview, Boundary Perception, & Urban Fabric.
- Current Implementation: Rendered via unified object template; 360° panorama showing elevated or characteristic district vantage; connected civic places and stories.
- Intended Behavior: High-altitude / elevated drone 360° panorama as the hero, allowing visual scanning of the entire district; embedded hotspots demarcating neighborhood boundaries, commercial corridors, and historic cultural landmarks; secondary 2D gallery showcasing street-level human scale.
- Future Possibilities: Dimensional 3D contour boundary line overlaid into the 360° horizon; historical boundary expansion animation demonstrating municipal annexation and demographic shifts over decades.

---

### 5.5 Entity Pages (`/[citySlug]/entities/[slug]`)
- Primary Media Role: Institutional Memory & Biographical Presence.
- Current Implementation: Unified object layout with 360° hero viewer, description, related stories, and civic relationships.
- Intended Behavior: Entities may use immersive 360° panoramas when meaningful civic place and physical context contribute to understanding the institution. When immersive spatial context is unavailable or unnecessary, archival photography, portraits, founding charters, headquarters imagery, and documentary records become the primary presentation format.
- Future Possibilities: Interactive organizational relationship graph; audio oral history recordings synchronized with photographic portraits.

---

### 5.6 Event Pages (`/[citySlug]/events/[slug]` or `.../moments/[slug]`)
- Primary Media Role: Historical Dramatic Inflection & Temporal Grounding.
- Current Implementation: Unified object template with 360° panorama viewer showing the modern physical site of the historic event.
- Intended Behavior: Dual-Media Split or Chrono-Viewer: The visitor stands in the modern 360° location, with an archival photograph of the historic event (e.g., the 1946 Oakland General Strike at 14th & Broadway) optically aligned and floating over the exact modern intersection. The user can adjust an opacity slider to witness the past superimposed on the present.
- Future Possibilities: 4D volumetric temporal recreation; spatialized reenactment audio anchored to the physical coordinates of the intersection.

---

### 5.7 Artifact Pages (`/[citySlug]/artifacts/[slug]`)
- Primary Media Role: Physical Materiality, Tactility, & Forensic Inspection.
- Current Implementation: Unified object template with 360° panorama hero.
- Intended Behavior: Artifacts may appear within a 360° civic context when location contributes meaning to the object.

However, artifact interpretation prioritizes evidentiary media, including:

- Macro photography
- Archival imagery
- Technical drawings
- 3D object representations

The artifact itself remains the primary subject of examination.

- Future Possibilities: Interactive 3D photogrammetric inspection allowing users to rotate, tilt, and examine artifact patinas under dynamic studio lighting.

---

### 5.8 Moment Pages (`/[citySlug]/moments/[slug]`)
- Primary Media Role: Ephemeral Human Resonance & Poetic Micro-History.
- Current Implementation: Unified object template linked from timeline and explore bento.
- Intended Behavior: Evocative full-bleed historical photograph or short archival film clip as the primary visual; quiet, intimate presentation; spatial link provided as an optional "Visit this coordinate today" portal that opens a 360° view.
- Future Possibilities: Spatialized binaural soundscapes (ambient street sounds, rain on awnings, tram bells) paired with single archival photographs.

---

### 5.9 Story Pages (`/[citySlug]/stories/[slug]`)
- Primary Media Role: Cinematic Narrative Portal & Deep Editorial Immersion.
- Current Implementation: 60–70vh 360° hero view anchoring the story location (e.g., 8th & Peralta); editorial magazine body with elegant typography, contemporary illustration, pull quotes, related object cards, right-rail search, and right-rail sponsor module.
- Intended Behavior: The 360° hero acts as the establishing shot that draws the reader into the world. Once the user scrolls into the narrative prose, media transitions strictly to curated 2D photography, historical comparison plates, maps, and archival scans. Interactive 360° viewers never embed directly inside body paragraphs (preventing scroll hijacking). Instead, textual references to other locations contain "Spatial Anchor Links" that smoothly expand an anchored lightbox or transition the reader to the target object.
- Future Possibilities: Ambient parallax illustration layers; synchronized read-along audio narration; side-by-side historical photographic overlays.

---

### 5.10 Sponsor Placements (`SponsorModule` & Homepage Spotlight)
- Primary Media Role: Governed Civic Stewardship & Architectural Harmony.
- Current Implementation: Premium, non-intrusive cards; high-contrast photography or clean logo graphics; gold border accents; explicit "Sponsored" label; strict governance preventing animated GIFs or distracting video; fallback to complete invisibility or preview-only placeholder.
- Intended Behavior: Complete exclusion from 360° spatial canvases. Sponsors may never brand, hijack, skin, or inject floating 3D billboards into panoramic viewports. All sponsor media is strictly confined to 2D card surfaces (`homepage_spotlight_tile`, story right-rail card, object page footer card).
- Future Possibilities: Governed "Civic Partner Collections" where cultural institutions or civic foundations sponsor the digitization of specific archival collections, marked by an elegant, understated institutional patron plaque.

---

## 6. Micro-Interactions, Motion & State Transitions

Immersive media must feel alive without causing cognitive fatigue or vestibular discomfort.

## 6.1 Page Load & Camera Initialization
1. Initial Vector: Every panorama loads facing its configured `pan_x_initial` and `pan_y_initial` coordinates (default 0.5, 0.5 = center horizon), ensuring the primary civic subject is immediately in view.
2. Atmospheric Auto-Rotation:
   - On desktop, the viewer initiates a subtle, slow auto-rotation at exactly 3° per second.
   - This motion communicates dimensionality without inducing dizziness.
   - Any user interaction (click, drag, touch, keyboard arrow, or focus on a hotspot) instantly halts auto-rotation.
3. Pitch Lock Safety:
   - Pitch is strictly clamped to ±14° from the horizon.
   - This prevents disorienting views straight into the sky zenith or nadir tripod shadows, keeping the eye level anchored to realistic human perspective.

## 6.2 Hover, Focus, & Hotspot Transitions
1. Hotspots:
   - Rendered as gold rings (`oklch(82% .13 85)`) with semi-transparent dark center fills and sharp SVG icons.
   - Rest state: subtle ambient pulse (opacity oscillation between 0.8 and 1.0 over 3 seconds).
   - Hover / Focus state: scale transforms smoothly to 1.15×, ring brightens to full gold, and a clean glass tooltip card displays the target title and entity badge.
   - Click / Activation: initiates navigation to the destination; Implementations may optionally perform a short camera-centering animation before navigation, but this behavior is not required.
2. Card & Bento Portal Peeks:
   - Cards displaying a spatial badge do not run active WebGL instances while at rest.
   - On hover (>300ms dwell) or keyboard focus, a lightweight CSS or video loop initiates a slow 5% horizontal pan, signaling that a 360° world awaits behind the click.
   - Portal Peeks activate after approximately 300ms of sustained hover or keyboard focus. 
   - Portal Peeks must remain lightweight and must not instantiate full
immersive panorama viewers while at rest.

Their purpose is to signal spatial
possibility rather than render the
destination itself.

## 6.3 Accessibility & Reduced Motion
- When `prefers-reduced-motion: reduce` is detected (or when the user toggles the UI Motion control):
  - Auto-rotation is completely disabled (0°/s).
  - Horizon drift and hover scaling are suppressed.
  - Hotspots transition states instantaneously with zero continuous pulsing.
  - Keyboard navigation (arrow keys for pan, Enter/Space for hotspots) remains fully functional with prominent high-contrast focus rings.

---

## 7. Cards, Thumbnails, Portals & Secondary Surfaces

A critical architectural mandate is that lightweight proxy media must protect performance and battery life.

```text
+--------------------------------------------------------------------------+
|                     SURFACE-LEVEL MEDIA PROXY RULES                      |
+--------------------------------------------------------------------------+
| - Search Result Cards: STRICTLY STATIC 2D THUMBNAILS (80x80 or 140px)    |
|   -> Zero WebGL canvases; instant rendering and high list performance.    |
|                                                                          |
| - Explore Bento Tiles: DUAL-STATE PORTAL PROXIES                         |
|   -> Resting state: Optimized 16:9 / 4:3 static photographic poster.     |
|   -> Active state: Optional micro-panning clip on intentional hover/dwell.|
|                                                                          |
| - Games (Word Scramble / Word Search): EDITORIAL & ARCHIVAL FOCUS        |
|   -> Zero 360° engines in active puzzle surfaces. Clean, accessible      |
|      civic palette, high-contrast typography, and archival illustrations.|
|                                                                          |
| - Timeline Track: NARROW PANORAMIC STRIP / STATIC AMBIENT SLICES         |
|   -> Horizontal scroll track uses atmospheric static slices to evoke     |
|      eras without bogging down trackpad momentum scrolling.              |
+--------------------------------------------------------------------------+
```

---

## 8. What Distinguishes Electrum from Traditional CMS and Encyclopedias

| Traditional CMS / Digital Encyclopedia (Wikipedia, Gov Portals) | Electrum Civic Atlas |
| :--- | :--- |
| Media as Illustration: Text is the primary data structure; images are small rectangular attachments floating in margins. | Media as Spatial Grounding: Physical geography and 360° presence form the primary scaffold; text enriches and contextualizes the space. |
| Flat Chronology: History is presented as linear timelines or disconnected article links. | Spatialized Memory: History is layered directly onto physical coordinates; places accumulate multiple eras and moments. |
| Generic Street Cameras: Omnidirectional cameras capture vehicle-centric, utilitarian street views with uncurated privacy blurs and visual clutter. | Cinematic Civic Curation: High-fidelity, artistic vantage points selected for civic, historical, and architectural significance. |
| Homogeneous Card Grids: Interchangeable card templates where an event, person, building, and book look identical. | Differentiated Epistemic Layouts: Places open into spherical portals; stories unfold as rich magazines; artifacts invite forensic inspection. |
| Ad-Driven Visual Pollution: Banners, popups, and sponsored content disrupt layout and degrade trust. | Strictly Governed Civic Aesthetic: High-contrast night-blue and gold palette; sponsorship quarantined into quiet, elegant, non-intrusive modules. |

---

## 9. Architectural Foundations for Downstream Work

This specification serves as the conceptual contract for the upcoming technical foundations:

1. Media Foundation: Defines schema, CDN storage tiers, MIME validation, responsive image pipelines, and metadata contracts (`alt_text`, provenance, rights attribution).
2. Panorama Foundation: Defines equirectangular projection engines, WebGL memory management, multi-resolution tiling (cubemap/equirectangular), camera heading serialization, and VR/WebXR interfaces.
3. Hotspot Foundation: Governs UV-space coordinate mapping (pan_x, pan_y), gaze/cursor collision detection, polymorphic target resolution (target_type, target_id), hotspot visibility, and navigation behavior.

---

## 10. Hero Readability Layer

All immersive hero surfaces must
preserve typography legibility regardless
of underlying panorama brightness.

Viewer implementations shall provide:

- A subtle edge vignette
- A subtle global atmospheric scrim

Purpose:

- Maintain WCAG-compliant text contrast
- Preserve title readability
- Preserve hotspot visibility

Exact opacity and gradient values are
implementation-specific and may evolve
with the design system.

The requirement is readability,
not a fixed visual formula.

