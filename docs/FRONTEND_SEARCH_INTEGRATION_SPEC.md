# FRONTEND_SEARCH_INTEGRATION_SPEC.md

**Electrum — Frontend Search Integration Specification**
*Compatibility: SEARCH_MODEL.md · SEARCH_INDEXING_GUIDE.md · SEARCH_ROUTING_GUIDE.md ·
SEARCH_WORKFLOW.md · ARCHITECTURE.md · CONTRIBUTING.md · THEME_SCHEMA.md*
*Audience: Public UI engineers, Workspace*
*Last updated: 2026-10-13*

---

## 1. Purpose & Scope

### 1.1 What This Document Defines

This document defines how the Electrum public UI (`electrum-ui`) integrates with the
search subsystem. It covers:

- How the frontend calls the search API and consumes results
- How raw RPC responses are normalized into UI component props
- How pagination, loading states, and errors are handled
- How routing works from result to destination page
- Mobile vs. desktop layout differences
- The sponsorship exclusion boundary at the frontend layer

This document does not define the backend RPC contracts, indexing rules, or ranking
model. Those are defined in SEARCH_MODEL.md, SEARCH_INDEXING_GUIDE.md, and
SEARCH_WORKFLOW.md. This document does not define individual component internals —
see SEARCH_RESULT_CARD_SPEC.md, SEARCH_BAR_INTERACTION_SPEC.md, and
AUTOCOMPLETE_UI_SPEC.md.

### 1.2 Scope Boundary

The frontend search integration covers:
- The `/search` page component
- The `useSearch` hook
- The `/api/search` route handler
- The `normalizeSearchResponse` utility
- The `SearchResultList` component container
- The `SearchFilterBar` component (entity type filter)
- Pagination controls

The following are explicitly out of scope for this document:
- The `SearchBar` component — see SEARCH_BAR_INTERACTION_SPEC.md
- Individual result cards — see SEARCH_RESULT_CARD_SPEC.md
- Autocomplete — see AUTOCOMPLETE_UI_SPEC.md
- Backend RPC definitions — see SEARCH_MODEL.md §9

---

## 2. RPC Integration

### 2.1 Entry Point — /api/search

The frontend never calls `rpc_search` directly. All search requests flow through the
`/api/search` API route, which validates inputs, calls `rpc_search` via the service-role
client, and returns a normalized `SearchResponse`.

Browser → /api/search?q=&type=&limit=&offset=
→ deriveCityFromHostname() → city_id
→ rpc_search(p_query, p_city_id, p_entity_types, p_limit, p_offset)
→ SearchResponse JSON

Per CONTRIBUTING.md and ARCHITECTURE.md, the API route must:
- Use the service-role Supabase client (`createSupabaseServerClient()`)
- Resolve city identity via deriveCityFromHostname() before calling `rpc_search`
- Enforce `limit ≤ 20` server-side
- Never accept or forward a sponsorship parameter
- Return the `SearchResponse` shape defined in SEARCH_MODEL.md §4.2

### 2.2 API Route Contract

+ GET /api/search?q=<query>&type=<types>&limit=<n>&offset=<n>
+ City identity is derived from hostname; citySlug is not accepted.

Query parameters:
citySlug     removed  City identity is derived from hostname; no citySlug parameter is accepted.
q            string   required   Raw query string; max 200 chars (enforced server-side)
type         string   optional   Comma-separated entity_type values (e.g. story,object)
limit        number   optional   Default 10; max 20
offset       number   optional   Default 0

Response: SearchResponse (SEARCH_MODEL.md §4.2)
{
query:        string
city_id:      string
total:        number
results:      SearchResult[]
has_more:     boolean
next_offset:  number | null
}

Error responses:
400  Missing or invalid q
404  City not found (hostname resolution failed)


### 2.3 useSearch Hook

`useSearch` is the canonical client-side hook for consuming search results. It manages
the query state, loading state, pagination, and error state.

```ts
// Location: electrum-ui/lib/public/useSearch.ts

interface UseSearchOptions {
  // citySlug removed — city identity is derived server-side from hostname
  initialQuery?: string;
  entityTypes?: EntityType[];
  pageSize?:   number;   // default 10; max 20
}

interface UseSearchReturn {
  query:        string;
  setQuery:     (q: string) => void;
  results:      NormalizedSearchResult[];
  total:        number;
  isLoading:    boolean;
  isError:      boolean;
  errorMessage: string | null;
  hasMore:      boolean;
  loadMore:     () => void;
  reset:        () => void;
  activeTypes:  EntityType[];
  setTypes:     (types: EntityType[]) => void;
}

function useSearch(options: UseSearchOptions): UseSearchReturn

Rules:

useSearch must not call Supabase directly. All search requests must go through /api/search.
City identity is derived server-side from hostname; the hook must not accept or pass citySlug.

setQuery triggers a debounced API call (300 ms; see SEARCH_WORKFLOW.md §3 / Stage 1).

loadMore appends the next page to results without clearing the existing list.

reset clears results, query, and pagination state.

The hook must not call rpc_get_active_sponsorships or any sponsorship RPC. It must only call /api/search.

### 2.4 URL State Synchronisation
The search page synchronises its state with the URL query string using Next.js App Router searchParams (useSearchParams). 
“The search URL must never contain sponsor, campaign, or placement parameters. Only query, type, limit, and offset are allowed.
This ensures search results are shareable and browser-history-navigable.

/search?q=lake+merritt
/search?q=lake+merritt&type=story,object
/search?q=lake+merritt&type=story&offset=10

Rules:

q is always written to the URL on submission (not on every keystroke).

type is written when the user applies an entity type filter.

offset is written when the user loads more results (pagination).

+ URL changes use Next.js router.replace to avoid polluting browser history with intermediate pagination states.
+ The initial search submission uses Next.js router.push.

On page load with a pre-populated ?q=, the search is executed immediately.

The URL must never contain a sponsor, campaign, or placement parameter.

### 2.5 Pagination
Search results use offset-based pagination in v1 (SEARCH_MODEL.md §4.3).

Parameter	Value
Default page size	10
Maximum page size	20 (enforced server-side)
Pagination style	"Load more" button (not paginated navigation)
Maximum offset	980 (20 results × 49 pages)

When has_more = true, a Load more results button is rendered below the result list.
Clicking it calls loadMore(), which sets offset = next_offset and fetches the next
page. Results are appended to the existing list — the list does not reset.

The "Load more" button:

Has aria-label="Load more search results" at all times

Shows a loading spinner while the next page is fetching

Is removed from the DOM when has_more = false

Is disabled (not hidden) while a fetch is in progress

### 2.6 Error Handling
Error condition	User-facing message	Technical action
Network error (fetch failed)	"Search is temporarily unavailable. Please try again."	Log to console; do not write to admin_action_logs
400 Bad Request	"Please enter a valid search term."	Show inline below search bar
404 City Not Found	"This city could not be found."	Show inline; offer link to /atlas
500 Server Error	"Something went wrong. Please try again."	Log to console
Empty results (not an error)	"No results for '[query]'."	Render empty state component


Error messages are rendered in an element with role="alert" and aria-live="assertive"
so screen readers announce them immediately.

Empty results (total = 0) must not be treated as an error. They render the empty state
component, not the error component.

## 3. Result Normalization
### 3.1 Raw vs. Normalized Shape
rpc_search returns a JSON array of SearchResult objects (SEARCH_MODEL.md §4.1).
The frontend normalizes this raw shape into NormalizedSearchResult before passing it
to UI components. This normalization layer exists so that UI components never contain
conditional logic for handling null fields.


// Raw shape from rpc_search (SEARCH_MODEL.md §4.1)
interface SearchResult {
  result_id:       string;
  result_type:     string;
  title:           string;
  subtitle:        string | null;
  summary:         string | null;
  thumbnail_url:   string | null;
  city_id:         string;
  route:           string;
  relevance_score: number;
  match_type:      'exact' | 'fuzzy';
}

// Normalized shape consumed by UI components
interface NormalizedSearchResult {
  id:             string;          // result_id
  type:           EntityType;      // result_type, cast to EntityType
  typeLabel:      string;          // human-readable label (see §3.2)
  title:          string;          // result_id.title (always present)
  subtitle:       string;          // result.subtitle ?? typeLabel fallback
  summary:        string;          // result.summary ?? ''
  thumbnailUrl:   string | null;   // result.thumbnail_url
  thumbnailAlt:   string;          // `${title} thumbnail` or '' if null
  route:          string;          // result.route (used directly; see §3.3)
  isFuzzyMatch:   boolean;         // match_type === 'fuzzy'
  relevanceScore: number;          // result.relevance_score
}

### 3.2 Entity Type Labels

const ENTITY_TYPE_LABELS: Record<string, string> = {
  story:       'Story',
  object:      'Civic Object',
  timeline:    'Timeline',
  codex:       'Codex',
  game:        'Game',
  city:        'City',
  contributor: 'Contributor',
};

### 3.3 normalizeSearchResponse Utility

// Location: electrum-ui/lib/public/normalizeSearchResponse.ts

function normalizeSearchResult(raw: SearchResult): NormalizedSearchResult {
  const typeLabel = ENTITY_TYPE_LABELS[raw.result_type] ?? raw.result_type;
  return {
    id:             raw.result_id,
    type:           raw.result_type as EntityType,
    typeLabel,
    title:          raw.title,
    subtitle:       raw.subtitle ?? typeLabel,
    summary:        raw.summary ?? '',
    thumbnailUrl:   raw.thumbnail_url,
    thumbnailAlt:   raw.thumbnail_url ? `${raw.title} thumbnail` : '',
    route:          raw.route,
    isFuzzyMatch:   raw.match_type === 'fuzzy',
    relevanceScore: raw.relevance_score,
  };
}

function normalizeSearchResponse(raw: SearchResponse): NormalizedSearchResponse {
  return {
    ...raw,
    results: raw.results.map(normalizeSearchResult),
  };
}

### 3.4 EntityType Enum

// Location: electrum-ui/lib/public/searchTypes.ts

export type EntityType =
  | 'story'
  | 'object'
  | 'timeline'
  | 'codex'
  | 'game'
  | 'city'
  | 'contributor';

export const ALL_ENTITY_TYPES: EntityType[] = [
  'story', 'object', 'timeline', 'codex', 'game', 'city', 'contributor',
];

## 4. Routing Behaviour
### 4.1 Use route Directly
NormalizedSearchResult.route is a pre-computed absolute path from the search index
(SEARCH_ROUTING_GUIDE.md §2.1). The frontend uses it directly with router.push or
<Link href={result.route}>. No route computation, slug interpolation, or entity-type
switching logic is performed in the frontend.

// Correct
<Link href={result.route}>{result.title}</Link>

// Incorrect — never reconstruct the route from parts
<Link href={`/${result.type}s/${result.id}`}>{result.title}</Link>

### 4.2 loadCityBySlug on Destination Page
When a user navigates to a search result destination, the destination page must first resolve city identity via deriveCityFromHostname(), then perform slug lookup via loadCityBySlug (server-side only).

### 4.3 City Context Preservation
When navigating to a result, Next.js App Router preserves the city context derived from hostname.
When navigating to a result in a different city (future; SEARCH_ROUTING_GUIDE.md §4.4),
the destination page loads its own city context.

### 4.4 Stale Route Handling
If a user navigates to a result route and the destination page returns 404 (content
unpublished after indexing), the destination page renders its own 404 UI. The search
results page does not pre-validate routes. See SEARCH_ROUTING_GUIDE.md §6.

## 5. Entity Type Filter Bar
### 5.1 Purpose
The SearchFilterBar component allows users to narrow results by entity type. It renders
as a horizontal strip of toggle buttons above the result list.

## 5.2 Filter State
Filter state is managed by useSearch.activeTypes. Default: all types active (no filter).
When one or more types are selected, type is appended to the URL and passed to
/api/search as a comma-separated list.

## 5.3 Filter Options
Button label	EntityType value
All	null (clears filter)
Stories	story
Objects	object
Timeline	timeline
Codex	codex
Games	game
Cities	city
Contributors	contributor


## 5.4 ARIA for Filter Bar

role="group"
aria-label="Filter results by type"

Each button:
  role="button"
  aria-pressed="true | false"
  aria-label="Filter by [label]"

## 6. Loading States
State	Visual	ARIA
Initial load (no query)	Empty search page with bar and placeholder text	No live region announcement
Query submitted, awaiting results	Skeleton cards (3 placeholder cards)	aria-busy="true" on results container; aria-live="polite" announces "Searching..."
Results received	Result cards	aria-live="polite" announces "[N] results for [query]"
Loading more (pagination)	Spinner on "Load more" button	aria-label="Loading more results"
Error	Error message component	role="alert" + aria-live="assertive"
Empty (no results)	Empty state component	role="status" announces "No results for [query]"


Skeleton cards must never contain placeholder text like "Loading..." — they are visual
placeholders only and must have aria-hidden="true".

## 7. Mobile vs. Desktop Layout
### 7.1 Search Page Layout
Viewport	Layout
Mobile (< 768 px)	Single column; search bar full-width at top; filter bar below bar as horizontal scroll strip; result cards stacked
Tablet (768–1023 px)	Two-column result grid; filter bar horizontal
Desktop (≥ 1024 px)	Three-column result grid; filter bar horizontal; result count + sort hint shown


### 7.2 Filter Bar on Mobile
On mobile, the filter bar renders as a horizontally scrollable strip. Individual buttons
do not wrap. A subtle gradient fade on the right edge indicates scroll availability.
Keyboard users can Tab through each filter button regardless of scroll position.

### 7.3 Pagination on Mobile
On mobile, the "Load more" button is full-width, 48 px minimum height, and positioned
at the bottom of the result list with 24 px bottom padding.

### 7.4 Result Count Display
On desktop: "Showing [n]–[n+limit] of [total] results for '[query]'" is rendered above
the result list.
On mobile: Result count is omitted to preserve vertical space. Screen reader users
receive the count via the aria-live announcement.

## 8. Sponsorship Independence
These rules apply to the frontend integration layer. They complement SEARCH_MODEL.md §7.

Rule	Enforcement
The search page must never render a sponsorship placement component	The search page template has no sponsor slot; no rpc_get_active_sponsorships call
useSearch must never accept a sponsor parameter	The hook signature has no sponsor field; adding one requires spec revision

The /api/search route must never forward a sponsor parameter	Route handler strips all non-spec parameters before calling rpc_search

Filter options must never include a sponsored content type	ALL_ENTITY_TYPES is a fixed enum; sponsor types are not valid EntityType values

“The search URL must never contain sponsor, campaign, or placement parameters. Only query, type, limit, and offset are allowed.	URL schema is defined in §2.4; non-spec parameters are ignored

Result cards rendered on the search page must never display sponsor attribution	See SEARCH_RESULT_CARD_SPEC.md §7
Navigation from a search result must never trigger a sponsor interstitial	result.route is a direct civic path; no redirect through sponsor tracking


## 9. Component File Locations

electrumbroadcasting-city
  src/components
 
  
All components in components must use the canonical CityTheme shape
(THEME_SCHEMA.md) for all color and typography tokens. No hardcoded colors.

## 10. CONTRIBUTING.md Integration Checklist
The following items must be verified when implementing or modifying the search frontend:

[ ] /api/search uses createSupabaseServerClient() (service-role)

[ ] /api/search resolves city identity via deriveCityFromHostname() before rpc_search

[ ] useSearch must not call Supabase directly. All search requests must go through /api/search

[ ] /search does NOT call loadCityBySlug; city identity is derived from hostname only

[ ] No component in components/public/search/ calls rpc_get_active_sponsorships

[ ] No component in components/public/search/ contains hardcoded color values

[ ] All color and typography tokens are from city_design_system.published_theme via CityTheme

[ ] Search page does not render <SponsorBar />, <AdSlot />, or any sponsor component
