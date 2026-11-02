# SEARCH_ROUTING_GUIDE.md

**Electrum — Civic Atlas Search Routing Guide**
*Compatibility: SEARCH_MODEL.md · SEARCH_INDEXING_GUIDE.md · ARCHITECTURE.md · CONTRIBUTING.md · OBJECT_PAGE_MODEL.md · STORY_PAGE_MODEL.md*
*Audience: Public UI engineers, Workspace, routing contributors*
*Last updated: 2026-10-13*

---

## 1. Purpose

### 1.1 Why Routing Is Part of the Search Spec

A search result is only useful if it navigates the user to the correct destination. In
Electrum, every searchable entity has a canonical public URL determined by:

1. The city it belongs to (`cities.slug`)
2. Its entity type (which determines the URL segment)
3. Its own slug (`civic_[type].slug`, `games.slug`, etc.)

These three components are assembled at **index time** and stored in `search_index.route`.
The public UI navigates to `result.route` directly — no route computation happens at
query time or display time.

This guide defines:
- How `route` is constructed for each entity type
- How routing behaves in different city contexts
- How the UI handles missing, deleted, or stale routes
- Sponsorship independence guarantees for the routing layer

---

## 2. Route Construction

### 2.1 Route Field Contract

`search_index.route` is a string containing the exact absolute path for the result,
beginning with `/`. It does not include the protocol, domain, or query string.

Valid:   /stories/the-last-mural-on-telegraph
Invalid: https://city.example.com/example-city/stories/sample-story
Invalid: /example-city/stories/sample-story?ref=search

Routes are stored as computed values. When a slug changes on a source record,
`rpc_reindex_entity` is called by the source table trigger and recomputes the route.
Old routes are not preserved in `search_index`; they are overwritten. The source
record itself manages slug redirect entries (301 redirects for 90 days after slug change).

### 2.2 Route Construction Function

Workspace constructs routes according to this function — implemented inside
`rpc_reindex_entity` but reproduced here for clarity:

```ts
function buildRoute(
  entityType: string,
  objectType: string | null,  // for 'object' entity_type, the civic table name
  citySlug:   string,
  entitySlug: string,
  facet:      string = 'primary'
): string {
  switch (entityType) {
    case 'story':       return `/stories/${entitySlug}`;
    case 'object':
      switch (objectType) {
        case 'civic_entities':      return `/entities/${entitySlug}`;
        case 'civic_events':        return `/events/${entitySlug}`;
        case 'civic_places':        return `/places/${entitySlug}`;
        case 'civic_moments':       return `/moments/${entitySlug}`;
        case 'civic_artifacts':     return `/artifacts/${entitySlug}`;
        case 'civic_neighborhoods': return `/neighborhoods/${entitySlug}`;
        case 'civic_eras':
          return facet === 'codex'
            ? `/codex/${entitySlug}`
            : `/eras/${entitySlug}`;
      }
    case 'timeline':    return `/timeline`;
    case 'codex':       return `/codex/${entitySlug}`;
    case 'game':        return `games/${entitySlug}`;
    case 'contributor': return `/contributors/${entitySlug}`;
    default: throw new Error(`Unknown entity_type: ${entityType}`);
  }
}

## 3. Route Table
Complete routing map for all entity types. All routes are city-scoped in v1.

entity_type	object subtype	route pattern	example	destination page
story	—	/stories/[slug]	/stories/sample-story	Story Page
object	civic_entities	/entities/[slug]	https://city.example.com/entities/sample-entity	Object Page
object	civic_events	/events/[slug]	https://city.example.com/events/sample-event	Object Page
object	civic_places	/places/[slug]	https://city.example.com/places/sample-place	Object Page
object	civic_moments	/moments/[slug]	https://city.example.com/moments/sample-moment	Object Page
object	civic_artifacts	/artifacts/[slug]	https://city.example.com/artifacts/sample-artifact	Object Page
object	civic_neighborhoods	/neighborhoods/[slug]	https://city.example.com/neighborhoods/sample-neighborhood	Object Page
object	civic_eras (facet=primary)	/eras/[slug]	https://city.example.com/eras/sample-era	Object Page
timeline	cities	/timeline	https://city.example.com/timeline	Timeline Page
game	games	/games/[slug]	https://city.example.com/games/sample-game	Game Page
city	cities	/	https://city.example.com/	City Home
contributor	contributors	/contributors/[slug]	https://city.example.com/contributors/sample-contributor	Contributor Page


### 3.1 atlas routing
The /atlas route is a city-selector surface — it is not itself a search result destination.
Users navigating from /atlas to a city land on /, which is the 'city'
entity_type result. There is no entity_type = 'atlas' in v1.

## 4. City Context Rules
## 4.1 City-Scoped Search (v1 Default)
All v1 search is performed within a single city context. The search bar is available on
all /** routes. Queries are scoped to city_id of the current city.

Result routes always begin with the searched city's slug. Cross-city results are not
possible in v1 (rpc_search is city-scoped).

Correct interpretation:
This means:

All results belong to the city resolved from hostname

NOT that the slug appears in the URL

NOT that routes are prefixed with /<citySlug>/...

Why this is safe:
The same section explicitly says:

“The city context is derived from hostname.”

So Workspace must interpret “begin with the searched city’s slug” as city context, not URL prefix.

✔ No routing conflict.  
✔ No slug‑prefixed URLs.

The city context is derived from hostname:
Hostname: city.example.com
 deriveCityFromHostname()

### 4.2 City Context — User Inside a City
When the user is on any route within a city domain:

Search bar searches the current city only

All result routes are relative to the current city

Navigating to a result stays within the same city context

The city branding and design system remain active during and after search

### 4.3 City Context — Atlas Page
When the user is on /atlas:

The search bar searches city names only (entity_type = 'city')

rpc_search is called with p_entity_types = ['city']

Selecting a result navigates to / (City Home)

No city context is active; no branding is loaded until the user enters a city

Future: multi-city search from /atlas will call rpc_search with p_city_ids = NULL
(all cities). See SEARCH_MODEL.md §13.4.

### 4.4 Entity Belongs to a Different City (Future)
Cross-city results cannot appear because rpc_search is city-scoped. City identity is domain-based. 
When ulti-city search ships (SEARCH_MODEL.md §13.4), the following rules apply:

Result route always uses the result's own citySlug, not the searched city's slug
Correct interpretation:
This refers to future hostname switching, not URL structure.

Meaning:

If multi‑city search returns a result from another city,

The user will be navigated to that city’s domain, not a slug‑prefixed path.

Example (future):

User on city.example.com

Result belongs to SF

Navigation goes to another-city.example.com/entities/sample-entity

NOT:

/san-francisco/entities/...

The result card displays a "City: [City Name]" badge to disambiguate

Navigating to the result loads the destination city's branding and context

The user's city context switches to the destination city on navigation

## 5. Route Validation at Index Time
Routes are validated when built inside rpc_reindex_entity:

cities.slug must exist and be non-null for the entity's city_id

The source record's slug must be non-null and URL-safe (validated by source table constraints)

The constructed route must match the pattern for the entity's type

If validation fails (e.g., a city slug is null or a source slug contains invalid characters),
rpc_reindex_entity raises an exception and the search_index row is not written. The
exception is caught by the trigger wrapper and written to admin_action_logs as
search_index_entity_reindexed with metadata.error = '<reason>'.

## 6. Stale Route Handling
### 6.1 When Routes Become Stale
A route becomes stale when:

A slug changes on the source record

A city slug changes (rare; affects all entities in that city)

A source record is deleted but its search_index row is not immediately updated

### 6.2 Slug Change Handling
When a source record's slug changes, the source table trigger fires and rpc_reindex_entity
recomputes and overwrites the route field. The old route is no longer present in
search_index. The source page handles the 301 redirect from old slug to new slug for
90 days (per OBJECT_PAGE_MODEL.md §2.3 and STORY_PAGE_MODEL.md §2.1).

### 6.3 Destination Page 404 Handling
The destination page (Object Page, Story Page, Game Page, etc.) is responsible for
handling cases where the content no longer exists at the navigated route. This can happen
when:

A result was indexed, the user held the search result URL, and the content was
unpublished before they clicked

A slug changed and the redirect window has expired (> 90 days)

In all cases the destination page returns a 404 response. The search result card is not
responsible for pre-validating that its route is still live — this would require a
real-time eligibility check at render time, which is prohibited for performance reasons.

### 6.4 Deleted Content
When a source record is deleted (hard delete), the source table trigger fires with
TG_OP = 'DELETE' and sets search_index.is_published = false. The row is excluded from
all anon queries via RLS. No stale route can appear in search results for deleted content.

## 7. Search Page Route
The search results page is a standard public route:

/search?q=[query]
/earch?q=[query]&type=[entity_type]
/search?q=[query]&type=[entity_type]&offset=[n]

Rules:

The search page must call deriveCityFromHostname() first (CONTRIBUTING.md §3.1)

q is required; empty q redirects to /

type is optional; if present, maps to p_entity_types parameter of rpc_search

offset is optional; defaults to 0; maximum enforced server-side at 980 (20 results × 49 pages)

The search page must not render any sponsorship component

The search page must not call rpc_get_active_sponsorships

The URL must not contain any sponsor or campaign parameter at any time

## 8. Sponsorship Independence
The routing layer carries the same sponsorship exclusion guarantees as the search index
and search workflow. These rules apply to all components in the search results page and
all navigation events triggered by search results.

Rule	Enforcement
Search result navigation must never trigger a sponsorship placement	The search results page has no sponsor slot, no banner, and does not call rpc_get_active_sponsorships
Clicking a search result must navigate directly to route with no sponsor interstitial	route is a plain path string; no redirect through a sponsor tracking URL
result.route must never be a sponsor URL or campaign URL	route is constructed from civic content slugs only; CHECK constraint on entity_type blocks sponsor types
Search page URL parameters must never include sponsor or campaign identifiers	URL schema is defined above; no sponsor parameter is accepted or forwarded


## 9. Routing Integration Checklist
Workspace must verify the following for each new entity type added to search:

[ ] Source table has a slug column validated as URL-safe

[ ] Source table has a city_id FK → cities.id

[ ] A trigger calls rpc_reindex_entity on INSERT, UPDATE, DELETE

[ ] rpc_reindex_entity implements the route construction formula for the entity type

[ ] The route pattern is registered in ARCHITECTURE.md §2.3

[ ] The route is added to CONTRIBUTING.md §3.2 (loadCityBySlug required pages)

[ ] The destination page handles 404 gracefully when content is unpublished

[ ] No sponsorship component is rendered on the destination page via search navigation

## 10. Future Expansion
### 10.1 VR Routes
When the VR experience ships, search results for civic objects with published panoramas
will gain an optional vr_route field on the SearchResult:

The VR route is additive — it supplements route, never replaces it. Users without WebXR
always navigate to the standard route.

### 10.2 Immersive Media Routes
Panoramas are not independently searchable in v1 (they are displayed on their parent
Object Page). A future entity_type = 'panorama' may be added to search_index when
panoramas gain standalone pages. No schema change required beyond adding 'panorama' to
the entity_type CHECK constraint and implementing the extraction rule in rpc_reindex_entity.

### 10.3 Multi-City Routing
When multi-city search ships, result routes will reference cities the user is not currently
within. The public UI must handle cross-city navigation by loading the destination city's
branding before rendering the destination page. loadCityBySlug handles this already; no
routing change is required.

### 10.4 Federated Search
If Electrum ever federates search across multiple deployments (e.g., Electrum instances for
different regions), result routes may include a fully qualified origin. A future origin
field on SearchResult would carry the deployment base URL. This is documented here to
prevent premature use of route as an absolute URL.
