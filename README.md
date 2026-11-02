README.md — Electrum Broadcasting Platform
Electrum is a city‑based civic memory platform built on Next.js, Supabase, and a modular content architecture. It provides a public-facing experience for exploring cities, stories, events, eras, and places — and an admin-facing interface for managing all civic content.

This README provides a high-level overview of the project, its structure, development workflow, and core architectural principles.

1. Project Overview
Electrum consists of two applications:

1. Public UI — electrum-ui/
Next.js 14+ App Router

Client-side rendering

Uses anon Supabase key

Strict Row Level Security (RLS)

City-centric routing

Modular page system

Atlas globe visualization

2. Admin UI — electrum-admin/
+ Next.js
+ Server-side rendering allowed
+ Uses **two Supabase clients**:
+   • Trusted service-role client for privileged, identity-less operations
+   • Cookie-aware authenticated client for identity-dependent, RLS-aware operations
+ Admin UI does **not** rely solely on the service-role key.
+ Admin UI may bypass RLS only for trusted operations; identity-dependent RPCs must
+ use the cookie-aware client so RLS can evaluate the acting admin’s identity.

3. Supabase Backend
PostgreSQL database

Row Level Security (RLS)

PostgREST API

Storage buckets

SQL migrations

Functions and triggers

2. Repository Structure
Code
electrum-broadcasting/
│
├── electrum-ui/              # Public-facing Next.js app
│   ├── app/                  # App Router
│   ├── components/           # UI components
│   ├── lib/                  # Shared loaders & helpers
│   ├── providers/            # Supabase + client providers
│   └── public/               # Static assets
│
├── electrum-admin/           # Admin-facing Next.js app
│   ├── app/                  # App Router
│   ├── components/           # Admin UI components
│   ├── lib/                  # Admin loaders & helpers
│   └── public/               # Static assets
│
├── supabase/                 # Database migrations & config
│   ├── migrations/           # SQL migrations
│   ├── functions/            # SQL functions
│   └── policies/             # RLS policies
│
└── .github/                  # Copilot + Workspace instructions
    ├── AGENTS.md
    ├── CONTRIBUTING.md
    ├── ARCHITECTURE.md
    ├── DATA-MODEL.md
    ├── SUPABASE-RLS-GUIDE.md
    └── REPO-CLEANUP-PLAN.md
3. Development Setup
Prerequisites
Node.js 18+

pnpm or npm

Supabase CLI

Vercel CLI (optional)

Environment Variables
Public UI
Code
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
Admin UI
Code
SUPABASE_URL=<your-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
4. Running the Apps
Public UI
Code
cd electrum-ui
pnpm install
pnpm dev
Admin UI
Code
cd electrum-admin
pnpm install
pnpm dev
Supabase
Code
supabase start
supabase migration up
5. Architectural Principles
Electrum follows strict architectural rules:

5.1. Public UI
Must use createBrowserClient

Must use anon key

Must respect RLS

Must use shared loaders

Must not use service role

Must not fetch Supabase data in server components

5.2. Admin UI
Must use createServerClient

Must use service role

May use server components

May bypass RLS

5.3. Slug Resolution
All public slug lookups must use:

loadCityBySlug

loadCityAndPage

loadTimeline

5.4. Providers
SupabaseProvider wraps public UI

ClientProviders loads branding + design system

5.5. API Routes
Timeline: /api/timeline?citySlug=<slug>

Navigation: /api/city/navigation/[city]

6. Data Model
Electrum’s schema includes:

City Tables
cities

city_brand_settings

city_design_system

Modular Page Tables
city_pages

city_page_sections

city_page_blocks

Civic Content Tables
civic_events

civic_eras

civic_stories

civic_places

civic_entities

civic_artifacts

civic_neighborhoods

civic_moments

Relationship Tables
entity_eras

civic_relationships

Full schema details are in DATA-MODEL.md.

7. RLS Model
Electrum uses strict RLS:

Public UI (anon role)
Anon must be able to SELECT all public tables.

Admin UI (service role)
Service role bypasses RLS.

Full RLS rules are in SUPABASE-RLS-GUIDE.md.

8. Workspace Integration
Workspace uses the .github documentation to:

normalize Supabase usage

fix slug loaders

repair RLS

align API routes

remove dead code

enforce naming conventions

refactor providers

clean up the entire repo

The cleanup plan is defined in REPO-CLEANUP-PLAN.md.

9. Contributing
See CONTRIBUTING.md for:

commit guidelines

PR requirements

naming conventions

architectural rules

RLS rules

loader rules

provider rules

10. License
Electrum Broadcasting — © 2026
License details TBD.