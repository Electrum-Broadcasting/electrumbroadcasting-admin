# AGENTS.md 

## 1. Overview
Electrum is a city‑based civic memory platform with two applications:

•	electrumbroadcasting-city — public‑facing Next.js 14+ App Router application
•	electrumbroadcasting-admin — admin‑facing Next.js application
•	Supabase — backend (PostgreSQL + RLS + PostgREST + RPCs + Storage)

The public UI uses the anon Supabase key and is fully governed by strict RLS.
+ The admin UI uses **both** the service‑role key (for trusted, identity‑less operations)  
+ and a cookie‑aware authenticated client (for identity‑dependent, RLS‑aware operations).  
+ Admin UI does **not** rely solely on the service‑role key.

Workspace should treat Electrum as a modular, city‑centric content system with:

•	strong slug conventions
•	strict client/server boundaries
•	domain‑based routing (city identity derived from hostname)
•	unified loaders and RPC wrappers
•	consistent media, search, sponsorship, and games subsystems

Electrum’s architecture is designed for multi‑city scaling, strict safety, and spec‑driven normalization across all domains.

## 2. Directory Structure
Public UI (electrumbroadcasting-city/)
• 	Next.js 14+ App Router
• 	Uses anon Supabase key
• 	Strict RLS
• 	City centric routing
• 	Modular page system
• 	Atlas globe visualization
•	Explore / Codex / Timeline / VR entry / Games
Admin UI (electrumbroadcasting-admin/)
•	Next.js
•	Uses service role Supabase key
•	Full CRUD access
•	No RLS restrictions

## 3. Supabase Client Rules
Workspace must enforce:
Public UI
• Must use createBrowserClient from @supabase/ssr
• Must use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (process.env.NEXT_PUBLIC_SUPABASE_URL / process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
• Must not use createClient from @supabase/supabase-js
• Must not use import.meta.env.VITE_* variables — this is a Next.js 14+ App Router application, not a Vite application
• Must not create ad hoc clients inside pages
• Must use shared helpers for all queries
Admin UI
+ •    Admin UI uses **two distinct Supabase clients**, each with a different security contract:
+
+      1. **Trusted Service‑Role Client (identity‑less, bypasses RLS)**  
+         Use `createSupabaseServerClient()` only for:
+         • privileged writes  
+         • ingestion jobs  
+         • sponsorship management  
+         • admin curation  
+         • CEO escalation  
+         • accessing tables hidden from authenticated users  
+         • RPCs explicitly designed to bypass RLS  
+
+         This client **must not** be used for RPCs that inspect `auth.uid()` or require user attribution.
+
+      2. **Cookie‑Aware Auth Client (identity‑dependent, RLS‑aware)**  
+         Use `createSupabaseServerActionClient()` only for:
+         • RPCs that inspect `auth.uid()`  
+         • contributor editorial actions  
+         • admin actions requiring attribution  
+         • logging actions  
+         • any operation where RLS must evaluate the acting admin’s identity  
+
+         This client forwards the admin’s JWT and enforces RLS correctly.
+
+      **Critical Rule:** Workspace must never collapse these two clients into a single pattern.  
+      Service‑role = trusted, privileged, identity‑less.  
+      Cookie‑aware = authenticated, identity‑dependent, RLS‑aware.
Shared Rule
Workspace should remove:
•	duplicate client initializations
•	hardcoded Supabase URLs or keys
+ **Note:** Workspace must preserve the dual‑client architecture.  
+ Service‑role clients and cookie‑aware clients serve different security contracts  
+ and must not be merged or replaced with a single pattern.

## 4. RLS Rules
Workspace must ensure:
Public UI (anon role)
Anon must be able to SELECT:
•	cities
•	city_brand_settings
•	city_design_system
•	civic_events
•	civic_eras
•	civic_stories
•	civic_places
•	civic_entities
•	civic_moments
•	civic_artifacts
•	civic_neighborhoods
Policies must use:

to anon using (true)

Workspace should verify:
•	table-level GRANTs exist
•	RLS is enabled
•	no restrictive policies override anon SELECT

## 5. Slug Resolution Rules

Workspace must enforce:

#### City Resolution (hostname-derived — authoritative)
City identity is derived from the hostname, not from a citySlug path segment or query parameter.
All server-side loaders and API routes must call:
deriveCityFromHostname()
This function:
• reads the incoming request Host header
• maps hostname → city_id
• surfaces errors for unknown hostnames
• returns a consistent { city_id, citySlug } shape (internal context only)
• citySlug is never exposed in public URLs or query parameters

loadCityBySlug.ts may be used server-side only when a secondary slug lookup is required after city_id is established. It must never be called with a citySlug sourced from a URL path segment or query parameter.

#### Public Routes (all absolute — no /[citySlug]/ prefix)
All detail pages must resolve the city from hostname. Public routes are:
• /events/[eventSlug]
• /entities/[entitySlug]
• /places/[placeSlug]
• /moments/[momentSlug]
• /artifacts/[artifactSlug]
• /neighborhoods/[neighborhoodSlug]
• /stories/[storySlug]
• /objects/[objectSlug]
• /timeline
• /explore
• /search
• /games/[slug]
• /codex/[slug]
• /contributors/[slug]

#### API Routes (no citySlug query parameter)
• /api/search?q=&type=&limit=&offset=
• /api/timeline
• /api/city/navigation

Workspace should remove:
•	.single() calls
•	.maybeSingle() calls
•	direct Supabase queries inside pages

## 6. Provider Rules

Workspace must enforce:

SupabaseProvider
•	wraps entire public UI
•	provides browser client
•	must not hardcode slugs
•	must not block rendering
•	must not swallow errors

ClientProviders
• receives { city_id, citySlug } from server-side hostname resolution
• loads branding + design system using city_id
• uses citySlug only for RPCs that require city_slug
• loads city branding + design system
• must not assume Oakland
• must not deadlock UI
• must not fetch before hydration

Workspace should remove:
•	hardcoded "oakland"
•	blocking awaits in providers
•	duplicated city loaders

## 7. RPC Rules
Workspace must enforce:

Timeline
Correct RPC:
rpc('load_timeline', { city_slug })

City Navigation
Correct RPC:
rpc('load_city_navigation', { city_slug })

Workspace must ensure:
• uses shared slug loader server-side only, after city identity is resolved
• resolves city identity via deriveCityFromHostname() before calling RPCs
• passes city_slug to RPCs only when derived from hostname, never from URL path segments or query parameters
• surfaces errors
• returns consistent shapes
• resolves city identity via deriveCityFromHostname() before calling RPCs
• passes city_slug to RPCs only when derived from hostname, never from URL path segments or query parameters

## 8. Error Handling Rules
Workspace must enforce:
Public UI
•	never swallow Supabase errors
•	never collapse errors into null
•	always surface errors in UI
•	always log errors in console
•	always return meaningful API responses

Admin UI
•	may swallow errors if desired
•	service role bypasses RLS

## 9. Naming Conventions
Workspace should enforce:

•	pageSlug for modular pages
•	eventSlug, eraSlug, storySlug for detail pages
•	loadCityBySlug for slug resolution
•	loadCityAndPage for modular pages
•	loadTimeline for timeline

List Pages
• must use *.index.tsx naming
• must not use nested $citySlug.timeline.* patterns

## 10. Workspace Instructions
Workspace should:
Normalize
•	all Supabase usage
•	all slug loaders
•	all API routes
•	all client/server boundaries
•	all providers
•	all RLS policies
•	all error handling
•	all timeline logic
Remove
•	duplicate clients
•	hardcoded slugs
•	silent nulls
•	legacy loaders
•	mismatched routes
•	unused files
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

## 11. Sponsorship Rendering Rules
Workspace must enforce:
• All sponsorship rendering must go through resolveSponsorSlot()
• All sponsorship UI must use <SponsorModule>
Workspace must remove:
• any direct rendering of creative_assets
• any direct rendering of sponsorship_placements
• any bypass of resolveSponsorSlot

