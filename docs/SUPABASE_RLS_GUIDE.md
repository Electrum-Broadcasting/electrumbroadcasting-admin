SUPABASE-RLS-GUIDE.md
Electrum uses strict Row Level Security (RLS) across all public-facing tables. This guide defines the RLS model, required policies, table-level privileges, and safe access patterns for both the public UI (anon role) and admin UI (service role).
It is designed for both human contributors and AI agents (Copilot, Workspace) to maintain consistent, secure, and predictable RLS behavior across the platform.
1. RLS Philosophy
Electrum’s RLS model is built on three principles:
1. Public UI must be fully readable.
All public-facing tables must allow anon SELECT.
2. Admin UI must be fully privileged.
Admin uses the service role, which bypasses RLS.
3. No table should be partially readable.
Partial RLS leads to:
•	silent nulls
•	broken slug resolution
•	broken loaders
•	broken timeline
•	broken Atlas
•	broken modular pages
Workspace must enforce complete anon SELECT across all public tables.
2. Supabase Roles
Electrum uses three roles:
anon
•	Used by public UI
•	Must be able to SELECT all public tables
•	Must not be able to INSERT/UPDATE/DELETE
authenticated
•	Not used in public UI
•	May be used later for user accounts
service_role
•	Used by admin UI
•	Bypasses RLS
•	Full privileges
Workspace must ensure:
•	public UI uses anon
•	admin UI uses service role
•	no public page uses service role
3. Required RLS Policies
3.1. Enable RLS
Every public table must have:
Code
alter table public.<table> enable row level security;
Workspace should verify this for all civic and city tables.
3.2. Required anon SELECT policy
Every public table must have:
Code
create policy "Anon read <table>"
on public.<table>
for select
to anon
using (true);
Workspace should enforce this across:
•	cities
•	city_brand_settings
•	city_design_system
•	city_pages
•	city_page_sections
•	city_page_blocks
•	civic_events
•	civic_eras
•	civic_stories
•	civic_places
•	civic_entities
•	civic_artifacts
•	civic_neighborhoods
•	civic_moments
•	civic_relationships
3.3. Required table-level GRANT
Supabase requires both RLS policies and table-level privileges.
Every public table must have:
Code
grant select on public.<table> to anon;
Workspace should verify this for all civic and city tables.
4. Common RLS Failure Modes
Workspace should detect and repair the following:
4.1. Wrong role name
Incorrect:
Code
to public
Correct:
Code
to anon
4.2. Missing GRANT
Policy exists, but anon still gets 42501.
4.3. RLS disabled
Table exists but RLS is off.
4.4. Restrictive policies
Policies like:
Code
using (city_id = auth.uid())
These break public UI.
4.5. Missing policies on new tables
Workspace should automatically add anon SELECT policies to new civic tables.
4.6. Policies applied to wrong schema
Electrum uses public. Workspace should verify schema correctness.
5. Public UI Access Rules
5.1. Public UI must use anon client
Workspace must enforce:
Code
createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
5.2. Public UI must not use service role
Workspace must remove:
•	service role usage
•	server-side Supabase clients
•	direct SQL queries
5.3. Public UI must use shared loaders
Workspace must enforce:
•	loadCityBySlug
•	loadCityAndPage
•	loadTimeline
These loaders must be RLS-safe.
6. Admin UI Access Rules
6.1. Admin UI must use service role
Workspace must enforce:
Code
createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
6.2. Admin UI bypasses RLS
Workspace should not add RLS policies for admin-only tables.
6.3. Admin UI may use server components
Public UI may not.
7. RLS for Each Table
Workspace should ensure the following tables have anon SELECT:
City Tables
•	cities
•	city_brand_settings
•	city_design_system
Modular Page Tables
•	city_pages
•	city_page_sections
•	city_page_blocks
Civic Content Tables
•	civic_events
•	civic_eras
•	civic_stories
•	civic_places
•	civic_entities
•	civic_artifacts
•	civic_neighborhoods
•	civic_moments
Relationship Tables
•	entity_eras
•	civic_relationships
8. RLS Testing Guide
Workspace should test:
8.1. Anon list query
Code
GET /rest/v1/cities?select=id,slug
8.2. Anon slug query
Code
GET /rest/v1/cities?slug=eq.oakland
8.3. Civic content
Code
GET /rest/v1/civic_events?city_id=eq.<uuid>
8.4. Modular pages
Code
GET /rest/v1/city_pages?city_id=eq.<uuid>
8.5. Timeline
Code
GET /rest/v1/civic_moments?city_id=eq.<uuid>
Workspace should surface errors instead of silent nulls.
9. RLS Repair Procedures
Workspace should apply the following when RLS breaks:
9.1. Re-enable RLS
Code
alter table public.<table> enable row level security;
9.2. Drop broken policies
Code
drop policy if exists "<name>" on public.<table>;
9.3. Add correct anon SELECT
Code
create policy "Anon read <table>"
on public.<table>
for select
to anon
using (true);
9.4. Add GRANT
Code
grant select on public.<table> to anon;
9.5. Validate
Workspace should re-run anon queries.
10. Workspace Responsibilities
Workspace must:
Normalize
•	RLS policies
•	table-level GRANTs
•	Supabase client usage
•	slug loaders
•	API routes
Verify
•	anon SELECT works
•	service role bypasses RLS
•	public UI uses anon client
•	admin UI uses service role
Repair
•	broken policies
•	missing GRANTs
•	incorrect roles
•	restrictive conditions
•	schema mismatches
Prevent
•	future 42501 errors
•	silent nulls
•	broken slug resolution
•	broken timeline
•	broken Atlas

