# SEARCH_RESULT_CARD_SPEC.md

**Electrum — Search Result Card UI Specification**
*Compatibility: FRONTEND_SEARCH_INTEGRATION_SPEC.md · SEARCH_ROUTING_GUIDE.md ·
SEARCH_MODEL.md · THEME_SCHEMA.md*
*Audience: Public UI engineers, Workspace, designers*
*Last updated: 2026-10-13*

---

## 1. Purpose

The **SearchResultCard** is the atomic UI unit of the Electrum search results page.
Each card represents one `NormalizedSearchResult` and surfaces the title, entity type,
subtitle, summary, and thumbnail required to help a user decide whether to navigate to
the result.

The card is not a content surface — it is a navigation affordance. Its job is to give
the user enough information to recognize the result and commit to navigating. It never
shows the full content of the result; it routes the user to the page that does.

---

## 2. Card Structure

### 2.1 Anatomy

┌──────────────────────────────────────────────────────────────┐
│ [Thumbnail]  [Entity Type Badge]                             │
│              [Title]                                         │
│              [Subtitle]                                      │
│              [Summary excerpt]                               │
│              [Fuzzy match label — conditional]               │
└──────────────────────────────────────────────────────────────┘


On mobile (< 768 px), the thumbnail moves above the text block (stacked layout).
On tablet and desktop, the thumbnail is left-aligned with the text block to its right
(horizontal layout).

### 2.2 Fields

| Field | Source | Required | Notes |
|---|---|---|---|
| Thumbnail | `NormalizedSearchResult.thumbnailUrl` | No | When null: render entity type icon placeholder at same size |
| Entity Type Badge | `NormalizedSearchResult.typeLabel` | Yes | Always rendered; see §2.3 |
| Title | `NormalizedSearchResult.title` | Yes | Rendered as `<h3>` inside the card; linked to `result.route` |
| Subtitle | `NormalizedSearchResult.subtitle` | Yes (after normalization) | Rendered below title in muted style |
| Summary excerpt | `NormalizedSearchResult.summary` | No | Max 140 chars displayed; truncated with ellipsis |
| Fuzzy match label | `NormalizedSearchResult.isFuzzyMatch` | No | Shown only when `isFuzzyMatch = true`; see §2.4 |

### 2.3 Entity Type Badge

The badge is a small, rounded pill label identifying the entity type. It is always
rendered in the top-left of the card (or directly above the title on mobile).

| EntityType | Badge label | Badge color token |
|---|---|---|
| story | Story | `theme.primary_color` background; `theme.text_on_primary` text |
| object | Civic Object | `theme.surface_color` background; `theme.primary_color` text |
| timeline | Timeline | Same as object |
| codex | Codex | Same as object |
| game | Game | Same as object |
| city | City | Same as object |
| contributor | Contributor | Same as object |

Story is the only type with a filled accent-color badge; it receives elevated visual
priority consistent with its `entity_weight = 1.0` ranking position.

The badge must never be color-only — it always includes the text label. Screen readers
announce the badge text as part of the card's `aria-label`.

### 2.4 Fuzzy Match Label

When `isFuzzyMatch = true`, a small label is rendered below the summary:

~ Approximate match

This label uses the muted text style (`colors.foreground` at 50% opacity) and a `~`
prefix. It is never rendered for exact matches. It helps users understand why a result
appears that does not contain their exact query string.

ARIA: The label is included in the card's `aria-label` as "approximate match" at the end.

---

## 3. Routing Rules

### 3.1 Navigation on Click

The entire card is a navigation target. Clicking anywhere on the card navigates to
`result.route`. This is implemented using a `<Link>` wrapping the card, with the title
`<h3>` as the primary anchor for screen readers.

```tsx
<Link href={result.route} className="search-result-card">
  {/* card contents */}
</Link>
The card must not use <a> with a constructed href — always use result.route directly
(SEARCH_ROUTING_GUIDE.md §3.1).

### 3.2 Route Map (Display Reference)
result_type	route pattern	example
story          /stories/[slug]  https://city.example.com/stories/sample-story
object         /entities/[slug] https://city.example.com/entities/sample-entity
timeline       /timeline        https://city.example.com/timeline
game		/games/[slug]	https://city.example.com/games/sample-game
city		/		https://city.example.com
contributor    /contributors/[slug] https://city.example.com/contributors/sample-contributor


See SEARCH_ROUTING_GUIDE.md §3 for the complete route table.

### 3.3 Middle Click / Cmd+Click
The <Link> component must open in a new tab when middle-clicked or Cmd/Ctrl+clicked.
Next.js <Link> handles this natively; do not suppress default link behavior.

## 4. Styling Requirements
### 4.1 Theme Tokens
All colors and typography must use the canonical CityTheme tokens from
city_design_system.published_theme (THEME_SCHEMA.md §2). No hardcoded values.

Element	Token
Card background	theme.background_color
Card border	theme.primary_color at 10% opacity
Title text	theme.colors.foreground; theme.typography.heading font
Subtitle text	theme.colors.foreground at 65% opacity; theme.typography.body font
Summary text	theme.colors.foreground at 80% opacity; theme.typography.body font
Type badge background (story)	theme.primary_color
Type badge text (story)	theme.text_on_primary
Type badge background (other)	theme.colors.foreground at 10%
Type badge text (other)	theme.colors.foreground
Fuzzy match label	theme.colors.foreground at 50%
Focus ring	theme.accent at 100% opacity; 2 px solid; 2 px offset


### 4.2 Dimensions
Property	Value
Card min-height (desktop)	120 px
Card padding	16 px (desktop); 12 px (mobile)
Card border-radius	8 px
Thumbnail size (desktop)	80 × 80 px; border-radius 4 px; object-fit cover
Thumbnail size (mobile)	100% width × 140 px; object-fit cover; border-radius 4 px 4 px 0 0
Gap between thumbnail and text (desktop)	16 px
Title font-size	1rem (16 px); font-weight 600
Subtitle font-size	0.875rem (14 px)
Summary font-size	0.875rem (14 px)
Badge font-size	0.75rem (12 px); font-weight 500; padding 2 px 8 px


### 4.3 Hover and Focus States

.search-result-card:hover {
  background: theme.colors.foreground at 4% opacity;
  /* Do not change text color on hover — contrast must remain valid */
}

.search-result-card:focus-visible {
  outline: 2px solid theme.accent;
  outline-offset: 2px;
  border-radius: 8px;
}
Both hover and focus states must be visible in Windows High Contrast mode. Use
@media (forced-colors: active) to apply a forced-color outline instead of opacity-based
backgrounds.

### 4.4 ADA Contrast Requirements
Element	Minimum contrast ratio	Standard
Title text on card background	4.5:1	WCAG 2.1 AA
Subtitle text on card background	4.5:1	WCAG 2.1 AA
Badge text on badge background	4.5:1	WCAG 2.1 AA
Focus ring on card background	3:1	WCAG 2.1 AA (UI components)


The design system must validate these ratios whenever city_design_system.published_theme
is updated. City Admins may not publish a theme that fails these contrast checks.

## 5. ARIA Specification

<Link
  href={result.route}
  aria-label={buildCardAriaLabel(result)}
  role="listitem"   // parent SearchResultList has role="list"
>
  <img
    src={result.thumbnailUrl}
    alt={result.thumbnailAlt}  // '' when thumbnail is decorative placeholder
    aria-hidden={!result.thumbnailUrl}
  />
  <span aria-hidden="true" className="type-badge">{result.typeLabel}</span>
  <h3>{result.title}</h3>
  <p className="subtitle" aria-hidden="true">{result.subtitle}</p>
  <p className="summary" aria-hidden="true">{result.summary}</p>
  {result.isFuzzyMatch && (
    <span aria-hidden="true" className="fuzzy-label">~ Approximate match</span>
  )}
</Link>

function buildCardAriaLabel(result: NormalizedSearchResult): string {
  const parts = [
    result.typeLabel,
    result.title,
    result.subtitle !== result.typeLabel ? result.subtitle : null,
    result.isFuzzyMatch ? 'approximate match' : null,
  ].filter(Boolean);
  return parts.join(', ');
}

// Example output:
// "Story, The Last Mural on Telegraph, Investigation, approximate match"
// "Civic Object, Lake Merritt, Place"
The subtitle, summary, and badge are aria-hidden="true" because the full card label
is communicated through aria-label on the <Link>. This prevents redundant
announcements by screen readers.

## 6. Mobile Layout

┌────────────────────────────────────────┐
│ [Thumbnail — full width, 140px tall]   │
│                                        │
│ [Story badge]                          │
│ [Title]                                │
│ [Subtitle]                             │
│ [Summary]                              │
└────────────────────────────────────────┘
On mobile (< 768 px):

Thumbnail spans full card width at 140 px height; object-fit cover

Badge, title, subtitle, and summary are stacked below the thumbnail with 12 px padding

The entire card remains a single <Link> tap target

Minimum card height is 200 px to ensure comfortable touch target size

## 7. Sponsorship Independence
The SearchResultCard must never contain or render any sponsorship-related content.

Rule	Enforcement
No sponsor logo	NormalizedSearchResult has no sponsor field
No sponsor attribution text	Card renders only: typeLabel, title, subtitle, summary, isFuzzyMatch
No sponsored content badge	There is no 'sponsored' variant of the type badge
No click tracking URL for sponsors	result.route is a direct civic path; no redirect
No ad impression logging	The card's click handler uses router.push(result.route) only


## 8. Edge Cases
Scenario	Behavior
thumbnailUrl is null	Render the entity type icon (design system icon set) at 80×80 px with aria-hidden="true"
summary is empty string	Summary paragraph is not rendered; card height adjusts naturally
title is very long (> 80 chars)	Title truncates at 2 lines with CSS line-clamp: 2; full title available via aria-label
route is null or empty	Card is not rendered; an error is logged to the console. This should never occur in production — all indexed rows have a route.
isFuzzyMatch is true with exact-length title	Fuzzy label rendered below summary; no visual priority change


## 9. Component File Location

electrumbroadcasting-city/src/components/public/search/SearchResultCard.tsx
electrumbroadcasting-city/src/components/public/search/SearchResultCard.module.css
The card must be a pure presentational component — it receives NormalizedSearchResult
as a prop and has no internal data fetching, no Supabase calls, and no side effects beyond
navigation.
