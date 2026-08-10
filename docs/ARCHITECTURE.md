ARCHITECTURE.md
Electrum is a modular, city centric civic memory platform built on Next.js, Supabase, and a structured content model. This document describes the system architecture, module boundaries, routing conventions, data flow, and Supabase integration patterns.
It is designed for both human contributors and AI agents (Copilot, Workspace) to understand the platform holistically.
1. High-Level Architecture
Electrum consists of three major components:
1. Public UI (electrum-ui)
•	Next.js 14+ App Router
•	Client-side rendering for all public pages
•	Uses anon Supabase key
•	Strict RLS
•	City-centric routing
•	Modular page system
•	Atlas globe visualization
2. Admin UI (electrum-admin)
•	Next.js
•	Server-side rendering allowed
•	Uses service role Supabase key
•	Full CRUD access
•	No RLS restrictions
3. Supabase Backend
•	PostgreSQL database
•	Row Level Security (RLS)
•	PostgREST API
•	Storage buckets
•	SQL migrations
•	Functions and triggers
2. Routing Architecture (Public UI)
Electrum’s public UI is built around city slugs and modular pages.
2.1. City Landing
Code
/[citySlug]
Loads:
•	city metadata
•	branding
•	design system
•	featured modules
2.2. Modular Pages
Code
/[citySlug]/pages/[pageSlug]
Each page is defined in Supabase and rendered dynamically.
2.3. Detail Pages
Code
/[citySlug]/events/[eventSlug]
/[citySlug]/eras/[eraSlug]
/[citySlug]/stories/[storySlug]
2.4. Legacy Pages
Code
/cities/[slug]
/city-home/[slug]
2.5. Timeline
Code
/[citySlug]/timeline
Backed by:
Code
/api/timeline?citySlug=<slug>
2.6. Atlas
Code
/atlas
Global map of all cities.
3. Supabase Architecture
3.1. Public UI Client
Must use:
Code
createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
3.2. Admin UI Client
Must use:
Code
createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
3.3. RLS
Public UI uses anon role. Admin UI uses service role.
3.4. Tables
Core tables include:
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
4. Data Flow
4.1. Public UI
All public data flows follow this pattern:
1.	Slug resolution via loadCityBySlug.ts
2.	Branding + design system loaded in ClientProviders.tsx
3.	Module-specific loaders events, eras, stories, etc.
4.	Rendering client components only
4.2. Admin UI
Admin data flows follow:
1.	Server-side Supabase client
2.	Direct CRUD operations
3.	No RLS restrictions
4.	Server components allowed
5. Slug Resolution Architecture
5.1. Single Source of Truth
All public slug lookups must use:
loadCityBySlug.ts
This ensures:
•	consistent RLS behavior
•	consistent error handling
•	consistent shape
•	consistent client usage
5.2. Slug Types
•	citySlug
•	pageSlug
•	eventSlug
•	eraSlug
•	storySlug
6. Provider Architecture
6.1. SupabaseProvider
•	wraps entire public UI
•	provides browser client
•	must not block rendering
•	must not hardcode slugs
6.2. ClientProviders
•	derives slug from pathname
•	loads branding + design system
•	must not deadlock UI
•	must not swallow errors
7. API Architecture
7.1. Timeline API
Correct route:
Code
/api/timeline?citySlug=<slug>
7.2. City Navigation API
Code
/api/city/navigation/[city]
7.3. API Rules
•	must use service role
•	must validate slugs
•	must surface errors
•	must return consistent shapes
8. RLS Architecture
8.1. Public UI (anon role)
Anon must be able to SELECT:
•	cities
•	city_brand_settings
•	city_design_system
•	all civic tables
8.2. Policy Format
Code
create policy "Anon read <table>"
on public.<table>
for select
to anon
using (true);
8.3. Table-Level GRANT
Code
grant select on public.<table> to anon;
9. Error Architecture
Public UI
Must:
•	surface Supabase errors
•	log errors
•	avoid silent nulls
Admin UI
May:
•	swallow errors
•	use service role

10. Naming Architecture
Loaders
•	loadCityBySlug
•	loadCityAndPage
•	loadTimeline
Providers
•	SupabaseProvider
•	ClientProviders
11. Workspace Architecture
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
12. Deployment Architecture
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

