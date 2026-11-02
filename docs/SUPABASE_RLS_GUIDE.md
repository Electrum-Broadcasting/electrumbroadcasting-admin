# SUPABASE_RLS_GUIDE.md
Electrum uses strict Row Level Security (RLS) across all public-facing tables. This guide defines the RLS model, required policies, table-level privileges, and safe access patterns for both the public UI (anon role) and admin UI (service role).
It is designed for both human contributors and AI agents (Copilot, Workspace) to maintain consistent, secure, and predictable RLS behavior across the platform.

## 1. RLS Philosophy
Electrum’s RLS model is built on three principles:

### 1.1. Public UI must be fully readable.
All public-facing tables must allow anon SELECT.

### 1.2. Admin UI must be fully privileged.
Admin uses the service role, which bypasses RLS.

### 1.3. No table should be partially readable.
Partial RLS leads to:
•	silent nulls
•	broken slug resolution
•	broken loaders
•	broken timeline
•	broken Atlas
•	broken modular pages
Workspace must enforce complete anon SELECT across all public tables.

## 2. Supabase Roles
Electrum uses three roles:
anon
•	Used by public UI
•	Must be able to SELECT public tables subject to the documented column grants
•	Must not be able to INSERT/UPDATE/DELETE
authenticated
•	Used when a cookie-aware Supabase client forwards a signed-in user's JWT
•	Required for database functions and policies that inspect auth.uid()
service_role
•	Used by trusted admin server operations
•	Bypasses RLS
•	Full privileges
Workspace must ensure:
•	public UI uses anon
•	admin service-role clients are only used server-side after application-level admin authorization
•	auth.getUser() uses a cookie-aware client when validating the current user
•	RPCs that check auth.uid() receive the user's JWT, not the service-role key
•	no public page uses service role

## 3. Required RLS Policies
### 3.1. Enable RLS
Every public table must have:

alter table public.<table> enable row level security;

Workspace should verify this for all civic and city tables.

For `civic_object_page_settings` and `story_page_settings`, anon SELECT is limited
to the presentation and SEO columns listed in DATA_MODEL.md. Do not grant table-wide
SELECT; `updated_by` and `updated_at` remain unavailable to anon.

For `global_brand_settings`, anon SELECT is limited to `site_domain` and the
canonical theme-token columns in DATA_MODEL.md. global_brand_settings uses a status column (draft / published).  
Public SELECT is allowed only on the published row.
Admin roles (City Admin, CEO) may read and write both rows via service-role RPCs.
Draft rows are never exposed to anon/public clients.

For `games`, anon SELECT is limited to the canonical public game columns in
DATA_MODEL.md §3.14. Legacy ownership and compatibility columns remain unavailable.

### 3.2. Required anon SELECT policy
Every public table must have:

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
•	civic_object_page_settings (allowlisted columns only)
•	story_page_settings (allowlisted columns only)

### 3.3. Required table-level GRANT
Supabase requires both RLS policies and table-level privileges.

Every public table must have:

grant select on public.<table> to anon;

Workspace should verify this for all civic and city tables. The page-settings
tables and `global_brand_settings` are exceptions: use column-level grants for
their public presentation/SEO or theme columns only, not table-wide SELECT.

### 3.4 safety_hold update rights for civic_stories
City Admins may UPDATE safety_hold and safety_hold_notes for their city. CEO may UPDATE both for any city.

CEO administrative story actions must use cookie-aware RPCs so RLS can evaluate the acting admin's identity.

## 4. Common RLS Failure Modes
Workspace should detect and repair the following:
### 4.1. Wrong role name
Incorrect:

to public
Correct:

to anon

### 4.2. Missing GRANT
Policy exists, but anon still gets 42501.

### 4.3. RLS disabled
Table exists but RLS is off.

### 4.4. Restrictive policies
Policies like:

using (city_id = auth.uid())

These break public UI.

### 4.5. Missing policies on new tables
Workspace should automatically add anon SELECT policies to new public tables.
Page-settings tables also require explicit column-level grants.

### 4.6. Policies applied to wrong schema
Electrum uses public. Workspace should verify schema correctness.

## 5. Public UI Access Rules
### 5.1. Public UI must use anon client
Workspace must enforce:

createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 5.2. Public UI must not use service role
Workspace must remove:
•	service role usage
•	direct SQL queries

Public server components and loaders use a server-side anon client and remain
subject to RLS. Browser code uses the anon browser client. Service-role credentials
must never be used by public pages or APIs.

### 5.3. Public UI must use shared loaders
Workspace must enforce:
•	loadCityBySlug
•	loadCityAndPage
•	loadTimeline
These loaders must be RLS-safe.

## 6. Admin UI Access Rules
### 6.1. Application authentication
The admin application authenticates requests with the httpOnly `admin_session` cookie. Server components, server actions, and API routes must verify this session and enforce the required role before performing privileged operations. Middleware checks cookie presence as a routing guard; it is not a substitute for server-side authorization.

### 6.2. Service-role operations
`createSupabaseServerClient()` uses the service-role key and bypasses RLS. Use it only in trusted server-side code after validating the admin session and authorization. It does not carry the current user's Auth session, so `auth.getUser()` on this client cannot authenticate the request and RPCs using `auth.uid()` will not see the admin user.

### 6.3. User-scoped Auth and RPC operations
Use `createSupabaseServerActionClient()` (the `@supabase/ssr` cookie-aware client) when a request needs the caller's Supabase Auth identity. This client forwards the signed-in user's JWT, allowing `auth.getUser()` and RPCs that depend on `auth.uid()` to work. Keep service-role clients for separate privileged data operations where appropriate.

City Admins may INSERT production_units only via RPC during publication (Option A). Direct INSERT is not permitted.

### 6.4. Admin identity mapping
`admin_users.id` is the row's own primary key. `admin_users.user_id` must equal the linked `auth.users.id`; the legacy `auth_uid` column should remain equal to `user_id` while code still references it. Do not compare `admin_users.id` to the Auth user ID.

## 7. RLS for Each Table
Workspace should ensure the following tables have anon SELECT:

City Tables
•	cities
•	city_brand_settings
•	city_design_system
•	global_brand_settings (theme-token columns only)

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

## 8. RLS Testing Guide
Workspace should test:

### 8.1. Anon list query

GET /rest/v1/cities?select=id,slug

### 8.2. Anon slug query

GET /rest/v1/cities?slug=eq.<hostname-derived-citySlug>

### 8.3. Civic content

GET /rest/v1/civic_events?city_id=eq.<uuid>

### 8.4. EMPTY



### 8.5. Timeline

GET /rest/v1/civic_moments?city_id=eq.<uuid>
Workspace should surface errors instead of silent nulls.

## 9. RLS Repair Procedures
Workspace should apply the following when RLS breaks:

### 9.1. Re-enable RLS
Code
alter table public.<table> enable row level security;

### 9.2. Drop broken policies

drop policy if exists "<name>" on public.<table>;

### 9.3. Add correct anon SELECT

create policy "Anon read <table>"
on public.<table>
for select
to anon
using (true);

### 9.4. Add GRANT

grant select on public.<table> to anon;

### 9.5. Validate
Workspace should re-run anon queries.

## 10. Workspace Responsibilities
Workspace must:
Normalize
•	RLS policie
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
