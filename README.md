# electrumbroadcasting-admin

Secure role-based admin system for Supabase-backed content management, built with Next.js 14 App Router, TypeScript, and Tailwind.

## What is Included

- Supabase email/password auth flows:
	- Login
	- Create Account
	- Reset Password request
	- Update Password
- Protected admin routing under `/admin` with middleware checks.
- Server-side role authorization (`admin`, `editor`, `viewer`).
- Full CRUD modules for:
	- cities
	- themes
	- stories
	- places
	- scores
	- media_assets
	- admin_roles
- Shared admin UI components in `components/admin`.
- Shared Supabase and admin logic in `lib/supabase` and `lib/admin`.
- RLS policy script at `supabase/rls.sql`.

## Directory Structure

```text
app/
	admin/
		(auth)/
			login/
			create-account/
			reset-password/
			update-password/
		(protected)/
			cities/
			themes/
			stories/
			places/
			scores/
			media-assets/
			admin-roles/
components/
	admin/
lib/
	supabase/
	admin/
supabase/
	rls.sql
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Install and Run

```bash
npm install
npm run dev
```

## Security Model

### Route Protection

- `middleware.ts` protects `/admin/**` except auth routes.
- Protected layout at `app/admin/(protected)/layout.tsx` verifies user and role assignment.

### Authorization

- Role checks happen server-side in:
	- `lib/admin/auth.ts`
	- `lib/admin/actions.ts`
- Mutation rules:
	- `viewer`: read only
	- `editor`: create/update
	- `admin`: create/update/delete and manage `admin_roles`

### RLS

Run SQL in `supabase/rls.sql` to enforce the same permissions at the database layer.

## Notes About Schema Alignment

The UI is configured for common columns in each table. If your exact schema has additional fields or different names, update `lib/admin/config.ts` to match your production schema precisely.