CONTRIBUTING.md
Electrum is a city based civic memory platform built on Next.js, Supabase, and a modular content architecture. This document explains how to contribute safely and consistently to the Electrum codebase.
It is designed for both human contributors and AI agents (Copilot, Workspace) to follow the same rules and conventions.
1. Repository Structure
Public UI (electrum-ui/)
•	Next.js 14+ App Router
•	Uses anon Supabase key
•	Strict RLS
•	City centric routing
•	Modular page system
•	Atlas globe visualization
Admin UI (electrum-admin/)
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
2. Contribution Principles
2.1. Public UI must remain RLS safe
All public-facing code must use the anon Supabase client and must respect RLS.
Never use:
•	service role key
•	server-side Supabase clients
•	direct SQL queries
•	bypasses of RLS
2.2. Admin UI may use service role
Admin code can:
•	use service role
•	bypass RLS
•	perform unrestricted CRUD
2.3. No duplicate Supabase clients
Public UI must use:
createBrowserClient from @supabase/ssr.
Admin UI must use:
createServerClient from @supabase/ssr.
Never instantiate:
•	createClient from @supabase/supabase-js
•	hardcoded Supabase URLs
•	hardcoded keys
3. Slug Resolution Rules
3.1. Single source of truth
All public slug lookups must use:
loadCityBySlug.ts
This ensures:
•	consistent error handling
•	consistent shape
•	consistent RLS behavior
•	consistent client usage
3.2. Pages that must use loadCityBySlug
•	/[citySlug]
•	/[citySlug]/pages/[pageSlug]
•	/cities/[slug]
•	/city-home/[slug]
•	/[citySlug]/events/[eventSlug]
•	/[citySlug]/eras/[eraSlug]
•	/[citySlug]/stories/[storySlug]
•	/[citySlug]/timeline
4. Provider Rules
4.1. SupabaseProvider
Must:
•	wrap entire public UI
•	use browser client
•	not block rendering
•	not hardcode slugs
•	not swallow errors
4.2. ClientProviders
Must:
•	derive slug from pathname
•	load city branding + design system
•	avoid deadlocks
•	avoid blocking awaits
5. API Route Rules
5.1. Timeline
Correct route:
Code
/api/timeline?citySlug=oakland
5.2. City Navigation
Correct route:
Code
/api/city/navigation/[city]
5.3. All API routes must:
•	use service role client
•	surface errors
•	validate slugs
•	return consistent shapes
6. RLS Rules
6.1. Public UI (anon role)
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
6.2. Policy format
Code
create policy "Anon read <table>"
on public.<table>
for select
to anon
using (true);
6.3. Table-level GRANT
Code
grant select on public.<table> to anon;
7. Error Handling Rules
7.1. Public UI
Must:
•	surface Supabase errors
•	log errors
•	avoid silent nulls
•	avoid collapsing errors into empty states
7.2. Admin UI
May:
•	swallow errors
•	use service role
8. Naming Conventions
Slugs
•	citySlug
•	pageSlug
•	eventSlug
•	eraSlug
•	storySlug
Loaders
•	loadCityBySlug
•	loadCityAndPage
•	loadTimeline
Providers
•	SupabaseProvider
•	ClientProviders
9. Code Style
9.1. Public UI
•	Client components only
•	No server-side data fetching
•	No server components that fetch Supabase data
•	No blocking awaits in providers
9.2. Admin UI
•	Server components allowed
•	Service role allowed
9.3. General
•	Prefer shared helpers
•	Prefer modular functions
•	Avoid duplication
•	Avoid hardcoded slugs
•	Avoid hardcoded URLs
10. Workspace Instructions
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
11. Commit Guidelines
11.1. Commit Messages
Use structured, descriptive commit messages:
Code
YYYY.MM.DD <module>: <summary>
Example:
Code
2026.08.07 public-ui: normalize slug loaders
11.2. No large binary files
Add to .gitignore:
Code
*.tar.gz
*.zip
*.mp4
*.mov
*.psd
*.ai
12. Pull Request Guidelines
12.1. PRs must include
•	description of change
•	affected modules
•	RLS impact
•	Supabase client impact
•	slug resolution impact
12.2. PRs must not include
•	service role usage in public UI
•	new Supabase clients
•	hardcoded slugs
•	silent nulls
13. Testing Guidelines
13.1. Public UI
Test:
•	/atlas
•	/oakland
•	/oakland/pages/home
•	/oakland/timeline
•	/oakland/events/...
•	/oakland/eras/...
•	/oakland/stories/...
13.2. Admin UI
Test:
•	CRUD operations
•	branding updates
•	design system updates
14. Release Process
14.1. Pre-release
•	run Workspace normalization
•	verify RLS
•	verify slug resolution
•	verify timeline
•	verify Atlas
14.2. Release
•	tag with semantic version
•	push to main
•	deploy via Vercel
