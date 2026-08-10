AGENTS.md 
1. Overview
Electrum is a city based civic memory platform with two applications:
•	electrum-ui — public-facing Next.js 14+ app
•	electrum-admin — admin-facing Next.js app
•	Supabase — backend (PostgreSQL + RLS + PostgREST)
The public UI uses the anon Supabase key. The admin UI uses the service role key.
Strict RLS is enforced across all tables.
Workspace should treat Electrum as a modular, city centric content system with strong slug conventions and strict client/server boundaries.
2. Directory Structure
Public UI (electrum-ui/app/)
•	/[citySlug] — city landing pages
•	/[citySlug]/pages/[pageSlug] — modular public pages
•	/[citySlug]/events/[eventSlug] — event detail
•	/[citySlug]/eras/[eraSlug] — era detail
•	/[citySlug]/stories/[storySlug] — story detail
•	/atlas — global map
•	/cities/[slug] — legacy city pages
•	/city-home/[slug] — legacy landing pages
•	/api/* — server routes
Admin UI (electrum-admin/app/)
•	CRUD interfaces for all civic tables
•	Uses service role key
•	No RLS restrictions
3. Supabase Client Rules
Workspace must enforce:
Public UI
•	Must use createBrowserClient from @supabase/ssr
•	Must use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
•	Must not create ad hoc clients inside pages
•	Must use shared helpers for all queries
Admin UI
•	Must use createServerClient with service role key
•	May query any table without RLS restrictions
Shared Rule
Workspace should remove:
•	duplicate client initializations
•	hardcoded Supabase URLs or keys
•	legacy createClient from @supabase/supabase-js in public UI
4. RLS Rules
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
Code
to anon using (true)
Workspace should verify:
•	table-level GRANTs exist
•	RLS is enabled
•	no restrictive policies override anon SELECT
5. Slug Resolution Rules
Workspace must enforce:
Single source of truth
All public slug lookups must use:
loadCityBySlug.ts
This helper:
•	queries cities by slug
•	surfaces errors
•	returns consistent shape
•	prevents silent nulls
•	prevents duplicated logic
Pages that must use loadCityBySlug
•	CityLandingPageClient
•	PublicPageRenderer
•	city-home
•	cities/[slug]
•	events detail
•	eras detail
•	stories detail
•	timeline
•	any new public module
Workspace should remove:
•	.single() calls
•	.maybeSingle() calls
•	direct Supabase queries inside pages
6. Provider Rules
Workspace must enforce:
SupabaseProvider
•	wraps entire public UI
•	provides browser client
•	must not hardcode slugs
•	must not block rendering
•	must not swallow errors
ClientProviders
•	resolves slug from pathname
•	loads city branding + design system
•	must not assume Oakland
•	must not deadlock UI
•	must not fetch before hydration
Workspace should remove:
•	hardcoded "oakland"
•	blocking awaits in providers
•	duplicated city loaders
7. API Route Rules
Workspace must enforce:
Timeline
Correct route:
Code
/api/timeline?citySlug=oakland
Workspace should remove:
•	/api/${citySlug}/timeline (nonexistent)
City Navigation
Correct route:
Code
/api/city/navigation/[city]
Workspace should ensure:
•	uses shared slug loader
•	surfaces errors
•	returns consistent shape
8. Error Handling Rules
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
9. Naming Conventions
Workspace should enforce:
•	citySlug for dynamic city routes
•	pageSlug for modular pages
•	eventSlug, eraSlug, storySlug for detail pages
•	loadCityBySlug for slug resolution
•	loadCityAndPage for modular pages
•	loadTimeline for timeline
10. Workspace Instructions
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

