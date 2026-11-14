# PROTOTYPE_BEHAVIOR_ADDENDUM.md

This specification documents the exact values, layout offsets, timing thresholds, easing curves, and behavioral rules established across the Electrum prototype implementation and foundation architectural models (`MEDIA_PHILOSOPHY_AND_HIERARCHY`, `HOTSPOT_FOUNDATION`, `PANORAMA_FOUNDATION`, and `SEARCH_RESULT_CARD_SPEC`).

---

## 1. Portal Peek Timing

Portal Peeks provide an atmospheric preview of a 360° environment behind static cards and Explore bento tiles before committing to navigation.

| Parameter | Value | Behavior & Constraints |
| :--- | :--- | :--- |
| Hover / Focus Activation Dwell | `300 ms` | Intentional hover threshold before the peek sequence initializes. Prevents rapid cursor sweeps across grid layouts from triggering background decodes or motion loops. |
| Cross-Fade Duration | `400 ms` | CSS opacity cross-fade from static 2D hero crop to micro-panning equirectangular clip. |
| Micro-Pan Loop Duration | `4.0 s` | A slow, seamless horizontal drift ($\approx 5\%$ of total equirectangular width) at constant velocity ($1.25\% / \text{s}$) to signal an immersive sphere. |
| De-activation (Mouse Leave / Blur) | `200 ms` | Fades back to the crisp static crop; cancels loop immediately. |
| Reduced Motion Override | `0 ms` (disabled) | When `prefers-reduced-motion: reduce` is active, Portal Peeks remain strictly static; no zoom, pan, or video loop executes. |

---

## 2. Hover Dwell Timing

Electrum enforces strict dwell separation between incidental pointer traversal, desktop card inspection, and WebXR/VR spatial gazes.

| Surface / Interaction | Dwell Threshold | Execution Behavior |
| :--- | :--- | :--- |
| Hotspot Marker Hover (Desktop) | `0 ms` (immediate) | Hotspot badge transitions from `opacity-80` to `opacity-100` via standard 150 ms transition. No delay timer is applied. |
| Bento Tile Portal Peek | `300 ms` | Initiates micro-panning clip once the pointer remains motionless within the tile boundary for $\ge 300\text{ ms}$. |
| Search Input Debounce | `200 ms` | Keystroke debounce interval before executing client-side query matching against `SEARCH_INDEX`. |
| VR / WebXR Gaze Dwell (`linger_ms`) | `1500 ms` | Target reticle gaze dwell time required before triggering auto-activation of a spatial hotspot in immersive headsets (`HOTSPOT_MODEL.md §12`). |
| Haptic Feedback Trigger | At `1500 ms` | Emits configured `haptic_preset` (`soft` / `medium` / `strong`) upon gaze completion. |

---

## 3. Active Thumbnail Styling

Multi-panorama vantage switchers (`PanoramaThumbs` in `src/components/city-chrome.tsx`) and list/search thumbnails follow strict visual states:

### 3.1 Panorama Vantage Switcher (`PanoramaThumbs`)

```text
┌──────────────────────────────────────────────┐
│ [ View 1 ]  [ View 2 (Active) ]   [ View 3 ] │
│   border        border-gold         border   │
│   70% opac      100% opacity        70% opac │
└──────────────────────────────────────────────┘
```

* Pill Container: `glass flex items-center gap-1 rounded-sm p-1`
  * Background: `oklch(13% 0.02 240 / 0.7)` with `backdrop-blur(12px)`
  * Border: `1px solid oklch(26% 0.02 240 / 0.5)`
  * Padding: `4px` (`p-1`), gap `4px` (`gap-1`), radius `2px` (`rounded-sm`)
* Individual Thumbnail Dimensions: `w-12 h-8` ($48\text{ px} \times 32\text{ px}$, $3:2$ ratio)
* Background Crop Alignment: `backgroundPosition: ${p.pan_x_initial * 100}% center; backgroundSize: cover;`
* Inactive State:
  * Border: `1px solid var(--border)` (`oklch(26% 0.02 240)`)
  * Opacity: `0.7` (`opacity-70`)
  * Hover: `opacity-100`, `border-border/80`
* Active State (`p.id === activeId`):
  * Border: `1px solid var(--gold)` (`oklch(82% 0.13 85)`)
  * Opacity: `1.0` (`opacity-100`)
  * Box Shadow: Optional faint glow `0 0 10px oklch(82% 0.13 85 / 0.3)`
  * Accessibility: `aria-pressed="true"`, `aria-label="View [N] of [Total]: [Label]"`

### 3.2 Search Result Thumbnails (`SearchResultCard`)
* Desktop ($\ge 768\text{ px}$): $80\text{ px} \times 80\text{ px}$, `rounded-sm` ($4\text{ px}$), `object-fit: cover`, gap to text block $16\text{ px}$.
* Mobile ($< 768\text{ px}$): $100\% \text{ width} \times 140\text{ px height}$, `object-fit: cover`, `border-radius: 4px 4px 0 0`.
* Null Fallback: Render entity kind icon placeholder at identical $80 \times 80\text{ px}$ box with `aria-hidden="true"`.

---

## 4. Focus-Ring Behavior

Focus indicators must satisfy WCAG 2.1 AA ($\ge 3:1$ contrast against dark background) while preventing focus rings during pointer interaction.

```css
/* Universal Electrum Focus Ring Token */
--gold: oklch(82% 0.13 85);
--search-focus: var(--gold);
```

| Element / Component | Trigger | Focus Ring Geometry | Color Token | High-Contrast (WHCM) |
| :--- | :--- | :--- | :--- | :--- |
| Interactive Buttons & Links | `:focus-visible` | `outline: 2px solid; outline-offset: 2px;` | `var(--gold)` | `outline-color: Highlight` |
| Search Input (`.electrum-search-input`) | `:focus-visible` | `outline: 2px solid; outline-offset: 0px;` | `var(--search-focus)` | `outline-color: Highlight` |
| Search Submit Button | `:focus-visible` | `outline: 2px solid; outline-offset: -4px;` | `var(--search-focus)` | `outline-color: Highlight` |
| Explore Bento & Museum Tiles | `:focus-within`, `:focus-visible` | `outline: 2px solid; outline-offset: 3px;` | `var(--gold)` | `outline-color: Highlight` |
| Search Result Cards | `:focus-visible` | `outline: 2px solid; outline-offset: 2px;` | `var(--gold)` | `outline: 2px solid Highlight` |
| Panorama Viewer Canvas | `:focus-within` | Keyboard listener activated (`Arrow` keys pan); canvas outline is suppressed (`outline-none`) to avoid framing the entire skybox. | N/A | N/A |
| Hotspot Marker Button | `:focus-visible` | Marker core displays `2px solid var(--gold)` with tooltip badge opacity forced to `1.0` (`group-focus:opacity-100`). | `var(--gold)` | `outline-color: Highlight` |

---

## 5. Reset-View Timing

The "Reset view" control (`RotateCcw` button in the orbit pad) reorients the virtual camera from arbitrary coordinates to the curator's initial vector (`pan_x_initial`, `pan_y_initial`).

* Target Coordinates:
  $$\text{yaw}{\text{target}} = (\text{pan\_x\_initial} - 0.5) \times 360^\circ, \quad \text{pitch}{\text{target}} = \text{clamp}(-( \text{pan\_y\_initial} - 0.5) \times 180^\circ, -14^\circ, 14^\circ)$$
* Transition Duration: `0.5 s` ($500\text{ ms}$)
* Interpolation Property: `background-position` on panoramic canvas, and `left, top` on projected hotspot markers.
* Easing Curve: `cubic-bezier(0.2, 0.7, 0.2, 1)` (smooth acceleration into steep deceleration).
* Pointer Interaction Guard: Any pointer drag instantly sets `transition: none` to eliminate drag latency. On button trigger, `drag.current` is null, activating the $500\text{ ms}$ curve.
* Reduced Motion: If `prefers-reduced-motion: reduce` or `motionOff === true`, transition is `none` ($0\text{ ms}$ instant snap).

---

## 6. Tooltip & Hotspot Placement Offsets

Hotspots project three-dimensional equirectangular angles onto a responsive two-dimensional stage.

```text
              [ Hotspot Core: 20px x 20px ]
                          │
                          │ top-7 (28px)
                          ▼
            ┌───────────────────────────┐
            │ KIND BADGE (10px gold)    │  <- Glass Pill Tooltip
            │ Target Title (12px white) │     (px-3 py-1.5, rounded-sm)
            └───────────────────────────┘
```

### 6.1 Tooltip Card Geometry
* Marker Anchor:
  * Core Pin: $10\text{ px} \times 10\text{ px}$ gold circle (`rounded-full bg-gold shadow-[0_0_16px_var(--gold)]`)
  * Radar Ping Ring: $20\text{ px} \times 20\text{ px}$ expanding pulse ring (`animate-ping-ring`)
  * Container Transform: `-translate-x-1/2 -translate-y-1/2`
* Badge Offset:
  * Top Offset: `top-7` ($28\text{ px}$ from marker center; leaves an $18\text{ px}$ visual gap below the outer edge of the pin).
  * Horizontal Alignment: `left-1/2 -translate-x-1/2` (perfectly centered on marker azimuth).
  * Padding: `px-3 py-1.5` ($12\text{ px}$ horizontal, $6\text{ px}$ vertical).
  * Border & Glass: `glass rounded-sm` ($2\text{ px}$ radius, $1\text{ px}$ glass border).

### 6.2 Responsive Horizon Baseline Shift
To prevent hotspot markers from obscuring hero typography and action buttons on narrow screens:
* Desktop ($\ge 768\text{ px}$): Horizon baseline sits at $45\%$ of stage height:
  $$Y_{\text{screen}} = \text{size.h} \times 0.45 - (\text{pitch}{\text{hotspot}} - \text{pitch}{\text{camera}}) \times \text{pxPerDeg}$$
* Mobile ($< 768\text{ px}$): Horizon baseline shifts upward to $30\%$ of stage height:
  $$Y_{\text{screen}} = \text{size.h} \times 0.30 - (\text{pitch}{\text{hotspot}} - \text{pitch}{\text{camera}}) \times \text{pxPerDeg}$$

### 6.3 Frustum Culling Margin
* Edge Margin: $\pm 80\text{ px}$ buffer beyond visible canvas boundaries:
  $$\text{if } |dx| > \left(\frac{\text{size.w}}{2} + 80\text{ px}\right) \implies \text{Cull marker (do not render)}$$
* Prevents text labels up to $160\text{ px}$ wide from clipping or wrapping abruptly at the viewport boundary.

---

## 7. Compass Formatting

The compass readout provides continuous orientation anchored to municipal coordinates.

* Screen Positioning:
  * Placement: `absolute bottom-6 left-1/2 -translate-x-1/2 z-30` ($24\text{ px}$ from bottom edge, horizontally centered).
  * Responsive Visibility: `hidden md:block` (rendered only on desktop $\ge 768\text{ px}$ to protect mobile narrative space).
  * Container Style: `glass flex items-center gap-3 rounded-full px-4 py-2 text-xs tracking-[0.2em]`
* Icon Animation:
  * Lucide `Compass` ($14\text{ px} \times 14\text{ px}$), color `text-gold` (`oklch(82% 0.13 85)`).
  * Transform: `transform: rotate(${-yaw}deg)` (counter-rotated against camera azimuth so north indicator continuously tracks magnetic/spatial North).
* Azimuth Readout:
  * Alignment: `tabular-nums` for jitter-free fixed-width rendering.
  * Number Format: `3-digit` zero-padded integer azimuth:
    $$\text{heading} = \text{String}(\text{round}((\text{yaw} + 360) \pmod{360})).\text{padStart}(3, \text{"0"}) + \text{"°"}$$
* Cardinal Point Quantization (8-Point Compass Rose):
  When displaying cardinal intervals, heading rounds to the nearest $45^\circ$ sector:
  * $000^\circ\text{ N}$ ($337.5^\circ - 022.5^\circ$)
  * $045^\circ\text{ NE}$ ($022.5^\circ - 067.5^\circ$)
  * $090^\circ\text{ E}$ ($067.5^\circ - 112.5^\circ$)
  * $135^\circ\text{ SE}$ ($112.5^\circ - 157.5^\circ$)
  * $180^\circ\text{ S}$ ($157.5^\circ - 202.5^\circ$)
  * $225^\circ\text{ SW}$ ($202.5^\circ - 247.5^\circ$)
  * $270^\circ\text{ W}$ ($247.5^\circ - 292.5^\circ$)
  * $315^\circ\text{ NW}$ ($292.5^\circ - 337.5^\circ$)
* North Orientation
  Every panorama may define:
  * north_offset_degrees
  * This value establishes the relationship between image-space heading and true geographic north.
  * Compass displays should resolve against north_offset_degrees when available.
  * When no north calibration exists, image-space north may be used as a temporary fallback.
  * Geodetic calibration is preferred for published civic panoramas.
---

## 8. Control Positioning

All chrome elements maintain consistent absolute anchoring across 360° hero canvases:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ SiteHeader (Fixed, 0-60vh transparent -> 400ms transition to opaque)   │
│                                                     [ Codex Trigger ]  │
│                                                     top-24, right-6    │
│                                                     (56px x 56px)      │
│                                                                        │
│                                                                        │
│                                                                        │
│ Hero Narrative Overlay                                                 │
│ max-w-[1600px], px-6                                                   │
│ bottom-0, pb-24 (pb-40 mobile)                                         │
│ [Enter in VR] [PanoramaThumbs]                                         │
│                                    [ Compass ]      [ Orbit Pad ]      │
│                                    bottom-6, 50%    bottom-6, right-6  │
└────────────────────────────────────────────────────────────────────────┘
```

| Control Cluster | Coordinates / Classes | Geometry & Grid | Internal Items |
| :--- | :--- | :--- | :--- |
| Orbit Nudge Pad | `absolute bottom-6 right-6 z-30` ($24\text{ px}, 24\text{ px}$) | `grid grid-cols-3 gap-1 rounded-sm p-1.5 glass` | 5 buttons ($36 \times 36\text{ px}$): Look Up ($+5^\circ$), Rotate Left ($-30^\circ$), Reset View, Rotate Right ($+30^\circ$), Look Down ($-5^\circ$). |
| Motion Mode Cluster | Adjacent to orbit pad: `flex flex-col gap-1 rounded-sm p-1.5 glass` | $2 \times$ vertical buttons ($36 \times 36\text{ px}$) | Auto-rotate pause/play (`Pause`/`Play` icon $14\text{ px}$); Reduced motion toggle (`"Mtn"` / `"Off"`). |
| Codex Menu Button | `absolute right-6 top-24 z-30` ($24\text{ px}$ right, $96\text{ px}$ top) | `h-14 w-14 rounded-full glass place-items-center` ($56 \times 56\text{ px}$) | Centers `LogoSlot` ($32\times 32\text{ px}$); hovers to `border-gold`. |
| Vantage Switcher (`PanoramaThumbs`) | Inside hero action row: `mt-6 flex flex-wrap items-center gap-3` | Positioned at bottom-left in the curatorial overlay | Displayed if `panoramas.length > 1`. Adjacent to "Enter in VR" button. |
| "Enter in VR" CTA | Inside hero action row | `glass rounded-sm px-4 py-2 text-xs` | Gated on `settings.enable_vr_button && active`. Displays `Glasses` icon. |
| Compass Readout | `absolute bottom-6 left-1/2 -translate-x-1/2 z-30 hidden md:block` | Rounded pill ($40\text{ px}$ height, variable width) | Compass icon + $3$-digit azimuth readout. |

---

## 9. Animation Easing Curves & Motion Physics

| Motion Event | Duration | Easing Curve (`cubic-bezier` / function) | Intent & Feel |
| :--- | :--- | :--- | :--- |
| Camera Nudge & Reset | `500 ms` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Rapid initial rotation that settles with dignified, smooth municipal weight. |
| Auto-Rotation Velocity | Continuous | Linear rate: $3.0^\circ / \text{s}$ ($0.0524\text{ rad/s}$) | Subtle celestial rotation; slow enough to read without disorientation. Clamped to $\text{dt} \le 50\text{ ms}$ in `requestAnimationFrame`. |
| Radar Pulse (`ping-ring`) | `2500 ms` | `cubic-bezier(0.0, 0.0, 0.2, 1)` (infinite loop) | Expanding acoustic ripple: scales from $0.8\times$ to $2.2\times$ as opacity fades from $0.8 \to 0.0$. |
| SiteHeader Scroll Transition | `400 ms` | `ease` (`cubic-bezier(0.25, 0.1, 0.25, 1)`) | Smooth blend between transparent hero overlay and solid backdrop after $60\text{ vh}$ scroll. |
| Object / Story Card Hover | `300 ms` | `ease-out` (`cubic-bezier(0, 0, 0.2, 1)`) | Lift: `translate-y: -4px`, border brighten to `gold/60`, shadow spread `0 20px 50px -20px var(--gold)`. |
| Editorial Hero Image Zoom | `700 ms` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | High-end editorial magazine hover: subtle scale from $1.0\times$ to $1.05\times$. |
| Compact Search Expansion | `200 ms` | `ease` (`cubic-bezier(0.25, 0.1, 0.25, 1)`) | Smooth width expansion from $240\text{ px}$ to $360\text{ px}$ on focus. |
| Accordion / Radix Drawer | `200 ms` | `ease-out` | Clean chevron rotation ($180^\circ$) and content unfold. |
| Active Dragging | `0 ms` (`none`) | None (instantaneous pointer follow) | Drag bypasses CSS transitions completely to guarantee zero-latency 1:1 tactile tracking. |

## 10. Virtual Camera Density Scaling

imgH = viewportHeight × 1.35
imgW = imgH × 2
pxPerDeg = imgW / 360


## 11. Tactile Pointer Drag Sensitivity

Pointer-driven camera movement follows fixed angular coefficients and is not derived from projection density. 

Default values:

Horizontal drag:
  yaw = -0.25° per pixel

Vertical drag:
  pitch = +0.15° per pixel

These values remain constant regardless of viewport dimensions, pixel density, or projection scaling.

The purpose is to preserve consistent tactile camera behavior across devices and viewport sizes.

Projection density and user interaction sensitivity are independent concerns.
