# ARCHITECTURE.md
Electrum is a modular, city centric civic memory platform built on Next.js, Supabase, and a structured content model. This document describes the system architecture, module boundaries, routing conventions, data flow, and Supabase integration patterns.
It is designed for both human contributors and AI agents (Copilot, Workspace) to understand the platform holistically.

## 1. High-Level Architecture
Electrum consists of three major components:
### 1.1. Public UI (electrumbroadcasting-city/)
• 	Next.js 14+ App Router
• 	Uses anon Supabase key
• 	Strict RLS
• 	City centric routing
• 	Modular page system
• 	Atlas globe visualization
•	Atlas globe visualization
•	Explore / Codex / Timeline / VR entry / Games

### 1.2. Admin UI (electrumbroadcasting-admin/)
• 	Next.js App Router with server components and server actions
• 	Admin routes use the httpOnly admin_session cookie for application authentication
• 	Trusted server operations use the service-role Supabase key after server-side authorization
• 	Cookie-aware anon clients forward a user's Auth JWT for auth.getUser() and auth.uid()-dependent RPCs
• 	Service-role requests bypass RLS; user-scoped requests remain subject to RLS and database grants

### 1.3. Supabase Backend
•	PostgreSQL database
•	Row Level Security (RLS)
•	PostgREST API
•	Storage buckets
•	SQL migrations
•	Functions and triggers
•   	pg_trgm extension — required for fuzzy search 
•   	pgvector extension — reserved for semantic search 

## 2. Routing Architecture (Public UI)
Electrum’s public UI is built around city slugs and modular pages.

### 2.1. City Landing

Electrum uses city-specific domains. The landing page is the root of the domain: /

For example: city.example.com/

Loads:
• city metadata
• city branding
• city design system
• featured modules (Explore, Codex, Timeline, VR, Games)
• city navigation

### 2.2. EMPTY


### 2.3. Detail Pages

Civic Object Pages:
/events/[eventSlug]
/entities/[entitySlug]
/places/[placeSlug]
/moments/[momentSlug]
/artifacts/[artifactSlug]
/neighborhoods/[neighborhoodSlug]
/eras/[eraSlug]

Editorial Pages:
/stories/[storySlug]
/contributors/[contributorSlug]

Immersive Media:
Object Pages above load the Panorama Viewer and Hotspot Editor
when panoramas are associated with the civic object.


Games:
/games/[gameSlug]

Codex:
/codex/[codexSlug]

Search:
/search?q=[query]
Backed by:
/api/search?q=<query>&type=<types>&limit=<n>&offset=<n>


### 2.4. Search & Discovery
/search
/explore

### 2.5. Timeline

/timeline

Backed by:

/api/timeline

### 2.6. Atlas

Atlas is hosted at electrumatlas.world.

The public UI’s /atlas route must redirect to:

https://electrumatlas.world

Atlas provides:
• global map of all cities
• cross-city navigation
• city discovery
• global search entry point 

## 3. Supabase Architecture
### 3.1. Public UI Client

The public UI uses Next.js 14+ App Router and must instantiate Supabase with:

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'

Public UI rules:
• anon key only (no service-role key)
• server components may use createServerClient with anon key
• browser components may use createBrowserClient with the anon key for client-side interactions
• no service-role key in public UI
• no hardcoded URLs or keys
• domain-based city resolution (hostname), not slug prefixes

### 3.2. Admin UI Client
Use the shared helpers according to the operation:
• `createSupabaseServerClient()` for trusted server-side service-role operations
• `createSupabaseServerActionClient()` when Supabase must receive the signed-in user's Auth JWT
Do not call `auth.getUser()` or call `auth.uid()`-gated RPCs through the service-role client; it has no caller identity.

#### 3.2.1 Trusted vs Identity‑Dependent Operations (Critical Rule)
The admin application uses **two distinct Supabase clients**, each with a different
+security contract. Workspace must preserve this boundary exactly:

1. **Trusted Service‑Role Operations (Bypass RLS)**
   Use `createSupabaseServerClient()` **only** when:
   • performing privileged writes (insert/update/delete)
   • running ingestion jobs
   • running sponsorship management operations
   • running admin curation operations
   • running CEO escalation operations
   • accessing tables that are not visible to authenticated users (raw_ingestion, admin_action_logs, creative_assets)
   • calling RPCs that are explicitly designed to bypass RLS

   These operations **must not** rely on `auth.getUser()` or `auth.uid()` because
   the service‑role client has no caller identity. They operate with full database
   privileges and bypass RLS entirely.

2. **Identity‑Dependent Admin Operations (Respect RLS)**
   Use `createSupabaseServerActionClient()` **only** when:
   • calling RPCs that inspect `auth.uid()`
   • performing contributor‑scoped editorial actions
   • performing admin actions that require user attribution
   • accessing tables where RLS policies depend on the authenticated user
   • logging actions that require the acting user's identity

   These operations **must not** use the service‑role client, because doing so
   would erase the caller identity and break RLS logic.

**This dual‑client architecture is mandatory. Workspace must not collapse these
two clients into a single pattern.**

Service‑role = trusted, privileged, identity‑less.
Cookie‑aware = authenticated, identity‑dependent, RLS‑aware.

### 3.3. RLS
Public UI uses the anon role. Admin operations either use a server-authorized service-role client (which bypasses RLS) or a cookie-aware authenticated client when database policy/RPC logic must evaluate the user's identity.

### 3.4. Tables
3.4. Tables
Core tables include:

City:
•   cities
•   city_brand_settings
•   city_budget
•   city_design_system
•   city_prompts
•   city_safety_settings

Civic Content:
•   civic_events
•   civic_eras
•   civic_stories
•   civic_places
•   civic_entities
•   civic_moments
•   civic_artifacts
•   civic_neighborhoods

Immersive Media:
•   panoramas
•   hotspots

Sponsor:
•   sponsors
•   sponsor_profiles
•   sponsorship_campaigns
•   sponsorship_placements
•   creative_assets
•   sponsor_allocations

Games:
•   games
•   game_users
•   game_scores

Search:
•   search_index

## 4. Data Flow
### 4.1. Public UI
All public data flows follow this pattern:
1.  	City identity resolution via deriveCityFromHostname()
2. 	2. Secondary slug lookup via loadCityBySlug (server-side only, after city_id is established; never from URL path segments or query parameters; never passed from ClientProviders)
3.	Branding + design system loaded in ClientProviders.tsx
4.	Module-specific loaders events, eras, stories, etc.
Rendering via Next.js App Router server components and client components.
+   Public UI uses server components, server loaders, and the server-side anon Supabase client
+   for all hostname resolution, slug lookup, and data fetching operations.

### 4.2. Admin UI
Admin data flows follow:
1. Validate the `admin_session` cookie and enforce role authorization server-side.
2. Use the service-role client for intentionally privileged server operations.
3. Use the cookie-aware client for Supabase Auth identity and RPCs that inspect `auth.uid()`.
4. Keep service-role credentials out of browser code; service-role queries bypass RLS.
5. Server components and server actions are allowed.
6. Publish actions require content_tier selection and safety_hold = false.

## 5. Slug Resolution Architecture
### 5.1. Single Source of Truth
All public slug lookups must use:
loadCityBySlug.ts
This ensures:
•	consistent RLS behavior
•	consistent error handling
•	consistent shape
•	consistent client usage

### 5.2. Slug Types
•   	citySlug
•   	pageSlug
•   	eventSlug
•   	eraSlug
•   	storySlug
•   	entitySlug
•   	placeSlug
•   	momentSlug
•   	artifactSlug
•   	neighborhoodSlug
•   	gameSlug
•   	contributorSlug

## 6. Provider Architecture
### 6.1. SupabaseProvider
•	wraps entire public UI
•	provides browser client
•	must not block rendering
•	must not hardcode slugs

### 6.2. ClientProviders
•  	receives { city_id, citySlug } from server-side hostname resolution
•  	loads branding + design system using city_id
•  	retains citySlug only as internal RPC context (never passed to loaders or API routes)
•  	must not derive citySlug from pathname or query parameters
•	must not deadlock UI
•	must not swallow errors
• 	must not assume multi-tenant slug prefixes

## 7. API Architecture
### 7.1. Timeline API
Correct route:

/api/timeline

### 7.2. City Navigation API

City identity is derived from hostname; no citySlug or city path segment is accepted.

/api/city/navigation

### 7.3. Search API
/api/search?q=<query>&type=<types>&limit=<n>&offset=<n>

Backed by rpc_search (SEARCH_MODEL.md §9.1). Rules:
•   Must use service role client for the RPC call.
•   Must derive city identity from hostname using deriveCityFromHostname().
•   Must NOT accept or validate citySlug from query parameters; citySlug is internal context only.
•   Must enforce maximum limit of 20 server-side.
•   Must never accept or forward sponsorship parameters.
•   Must return SearchResponse shape (SEARCH_MODEL.md §4.2).
•   Must not log user queries.

city_slug passed to RPCs must be derived from hostname (deriveCityFromHostname), not from URL path segments or query parameters.

### 7.4. API Rules (all routes)
Public API routes (search, timeline, navigation) must use the service-role client.

Admin API routes must use:
– service-role client for privileged, identity-less operations, and
– cookie-aware client for RPCs that inspect auth.uid() or require user attribution.

## 8. RLS Architecture
### 8.1. Public UI (anon role)

Anon must be able to SELECT:
•   cities
•   city_brand_settings
•   city_design_system
•   all civic tables (civic_events, civic_eras, civic_stories, civic_places,
  civic_entities, civic_moments, civic_artifacts, civic_neighborhoods)
•   panoramas (WHERE status = 'published')
•   hotspots (WHERE is_active = true AND parent panorama status = 'published')
•   search_index (WHERE is_published = true)
•   sponsorship_placements (WHERE is_active = true)
Anon must NOT directly access:
•   sponsorship_campaigns
•   creative_assets (served via rpc_get_active_sponsorships)
•   sponsor_profiles
•   raw_ingestion
•   admin_action_logs
•   security_audit_log


### 8.2. Policy Format

create policy "Anon read <table>"
on public.<table>
for select
to anon
using (true);

### 8.3. Table-Level GRANT

grant select on public.<table> to anon;

## 9. Error Architecture
Public UI
Must:
•	surface Supabase errors
•	log errors
•	avoid silent nulls
Admin UI
May:
•	swallow errors
•	use service role

## 10. Naming Architecture
Loaders
•	loadCityBySlug
•	loadCityAndPage
•	loadTimeline
Providers
•	SupabaseProvider
•	ClientProviders

## 11. Workspace Architecture
Workspace should:
Normalize
•   Supabase usage
•   slug loaders
•   API routes
•   providers
•   error handling
•   timeline logic

Remove
•   duplicate clients
•   hardcoded slugs
•   silent nulls
•   legacy loaders
•   mismatched routes
•   unused files
•   deprecated ad_slots and ad_creatives references
•   direct queries to search_index (use rpc_search)
•   direct queries to sponsorship tables from public loaders (use rpc_get_active_sponsorships)

Refactor
•	public UI to consistent patterns
•	admin UI to service role patterns
•	shared helpers for all queries
Verify
•	anon SELECT works
•	slug resolution works
•	timeline works
•	Atlas works
•	public pages load
•	detail pages load
•	providers hydrate correctly

Workspace MUST NOT:
•   Query search_index directly from public UI — use rpc_search
•   Query sponsorship tables directly from public UI — use rpc_get_active_sponsorships
•   Write to search_index directly — use rpc_reindex_entity or rpc_reindex_city
•   Write to game_users.total_score or game_users.games_played directly (trigger-managed)
•   Set sponsorship_placements.is_active directly (trigger-managed via campaign status)
•   Include sponsorship parameters in any rpc_search call
•   Use deprecated ad_slots or ad_creatives tables in new code

## 12. Deployment Architecture
Public UI
•	deployed via Vercel
•	uses anon key
•	RLS enforced
Admin UI
•	deployed via Vercel
•	uses service role key
•	RLS bypassed
Supabase
•	migrations via CLI
•	policies via SQL
•	storage via buckets
