# CONTRIBUTING.md
Electrum is a city based civic memory platform built on Next.js, Supabase, and a modular content architecture. This document explains how to contribute safely and consistently to the Electrum codebase.
It is designed for both human contributors and AI agents (Copilot, Workspace) to follow the same rules and conventions.

## 1. Repository Structure
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
Supabase (supabase/)
•	SQL migrations
•	RLS policies
•	Functions
•	Triggers
•	Storage rules

## 2. Contribution Principles

### 2.1. Public UI must remain RLS safe
All public-facing code must use the anon Supabase client.
Never use:
•	service role key
•	direct SQL 
•	bypasses of RLS

### 2.2. Admin UI may use service role
Admin code can:
•	use service role
•	bypass RLS
•	perform unrestricted CRUD

### 2.3. No duplicate Supabase clients
Public UI must use:
import { createBrowserClient, createServerClient } from '@supabase/ssr'
•	SSR is allowed in Next.js App Router (server components + server loaders)
•	Public UI must not use createClient from @supabase/supabase-js
•	Public UI must not claim “there is no SSR”

Admin UI must use:
createServerClient from @supabase/ssr.
Never instantiate:
•	hardcoded URLs
•	hardcoded keys
•	multiple clients per module

## 3. Slug Resolution Rules
### 3.1. Single source of truth — city resolution
City identity for all public pages and API routes must be derived from the request hostname:
deriveCityFromHostname()
This ensures:
• consistent city_id resolution across all routes
• no citySlug in URLs or query parameters; citySlug is internal context only
• consistent RLS behavior
• consistent error handling for unknown hostnames

loadCityBySlug.ts may be used server-side for secondary slug lookups when a slug is already known from a data join or other server-side context. It must never be driven by a URL path segment or query parameter.

### 3.2. Pages that may use loadCityBySlug only server-side, only after city_id is known, and never from URL path segments
• 	/events/[eventSlug]
• 	/entities/[entitySlug]
• 	/places/[placeSlug]
• 	/moments/[momentSlug]
• 	/artifacts/[artifactSlug]
• 	/neighborhoods/[neighborhoodSlug]
• 	/eras/[eraSlug]
• 	/stories/[storySlug]
• 	/timeline

(Note: These pages do NOT receive citySlug from ClientProviders; slug lookup is server-side only after city_id is resolved.)

## 4. Provider Rules
### 4.1. SupabaseProvider
Must:
•	wrap entire public UI
•	use anon client
•	not block rendering
•	not hardcode slugs
•	not swallow errors

### 4.2. ClientProviders
Must:
• receive { city_id, citySlug } from server-resolved hostname context
• load city branding + design system using city_id
• load city branding + design system using city_id
• avoid deadlocks
• avoid blocking awaits
Must NOT:
• extract citySlug from pathname or URL
• pass citySlug to any loader or API call
• treat citySlug as routing or query state

CitySlug is internal context only, used server-side for RPCs that require city_slug.

## 5. API Route Rules
Public API routes (search, timeline, navigation) always use service-role (identity-less).
• resolve city_id from hostname via deriveCityFromHostname()

Admin API routes:
• Use service-role for privileged, identity-less operations.
• Use cookie-aware client for RPCs that inspect auth.uid() or require user attribution.
This dual-client architecture is mandatory.

All API routes must:
• surface errors for unknown hostnames
• return consistent shapes
• never accept citySlug as a query parameter

### 5.1. Timeline
Correct route:
/api/timeline
City is resolved server-side from the request hostname. Do not append citySlug as a query parameter.

### 5.2. City Navigation
Correct route:
/api/city/navigation
City is resolved server-side from the request hostname. No path segment or query parameter carries city identity.

### 5.3. Search API
Correct route:
/api/search?q=&type=&limit=&offset=
City is resolved server-side from the request hostname. Do not append citySlug as a query parameter.
 

## 6. RLS Rules
### 6.1. Public UI (anon role)
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
• 	panoramas (where status = 'published')
• 	hotspots (where is_active = true and parent panorama status = 'published')

### 6.2. Policy format
Code
create policy "Anon read <table>"
on public.<table>
for select
to anon
using (true);
6.3. Table-level GRANT
Code
grant select on public.<table> to anon;

## 7. Error Handling Rules
### 7.1. Public UI
Must:
•	surface Supabase errors
•	avoid silent nulls
•	avoid collapsing errors into empty states

### 7.2. Admin UI
May:
•	swallow errors
•	use service role

## 8. Naming Conventions
City Resolution
• deriveCityFromHostname — primary; resolves city_id from request hostname
Slugs
•	citySlug (internal RPC context only; never appears in URLs)
•	pageSlug
•	eventSlug
•	eraSlug
•	storySlug
• 	entitySlug
• 	placeSlug
• 	momentSlug
• 	artifactSlug
• 	neighborhoodSlug
Loaders
•	loadCityBySlug
•	loadCityAndPage
•	loadTimeline
Providers
•	SupabaseProvider
•	ClientProviders

## 9. Code Style
### 9.1. Public UI
Electrum does use:

•	server components
•	server loaders
•	server-side Supabase anon client
•	/api/* route handlers

Public UI is not client-only.

### 9.2. Admin UI
•	Server components allowed
•	Service role allowed

### 9.3. General
•	Prefer shared helpers
•	Prefer modular functions
•	Avoid duplication
•	Avoid hardcoded slugs
•	Avoid hardcoded URLs

## 10. Workspace Instructions
Workspace should:
Normalize
•	Supabase usage
•	slug loaders
•	API routes
•	providers
•	error handling
•	timeline logic
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

## 11. Commit Guidelines
### 11.1. Commit Messages
Use structured, descriptive commit messages:
Code
YYYY.MM.DD <module>: <summary>
Example:
Code
2026.08.07 public-ui: normalize slug loaders

### 11.2. No large binary files
Add to .gitignore:
Code
*.tar.gz
*.zip
*.mp4
*.mov
*.psd
*.ai

## 12. Pull Request Guidelines
### 12.1. PRs must include
•	description of change
•	affected modules
•	RLS impact
•	Supabase client impact
•	slug resolution impact
### 12.2. PRs must not include
•	service role usage in public UI
•	new Supabase clients
•	hardcoded slugs
•	silent nulls

## 13. Testing Guidelines
### 13.1. Public UI
Test:
• 	/
• 	/atlas (electrumatlas.world)
• 	/timeline
• 	/events/...
• 	/entities/...
• 	/places/...
• 	/moments/...
• 	/artifacts/...
• 	/neighborhoods/...
• 	/eras/...
• 	/stories/...
### 13.2. Admin UI
Test:
•	CRUD operations
•	branding updates
•	design system updates

## 14. Release Process
### 14.1. Pre-release
•	run Workspace normalization
•	verify RLS
•	verify slug resolution
•	verify timeline
•	verify Atlas
### 14.2. Release
•	tag with semantic version
•	push to main
•	deploy via Vercel
