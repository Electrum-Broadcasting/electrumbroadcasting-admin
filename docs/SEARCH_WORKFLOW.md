# SEARCH_WORKFLOW.md

**Electrum — Civic Atlas Search End-to-End Workflow**
*Compatibility: SEARCH_MODEL.md · SEARCH_INDEXING_GUIDE.md · SEARCH_ROUTING_GUIDE.md · ARCHITECTURE.md · CONTRIBUTING.md*
*Audience: All Electrum contributors — UI engineers, backend engineers, Workspace, QA*
*Last updated: 2026-10-13*

---

## 1. Purpose

This document describes the complete lifecycle of a search query in Electrum — from the
moment a user types in the search bar to the moment a result card is rendered and
navigation occurs. It is the operational companion to SEARCH_MODEL.md (schema and RPC
definitions) and SEARCH_ROUTING_GUIDE.md (routing rules).

Read this document to understand:
- What happens at each stage of a search request
- Which system component is responsible at each stage
- How ranking decisions are made
- How the result is shaped and displayed
- How ADA requirements are met at each stage
- Where the sponsorship boundary is enforced

---

## 2. Workflow Overview

User input
│
▼
Stage 1: Input capture & debounce (Browser)
│
▼
Stage 2: Query normalization (Browser)
│
▼
Stage 3: API request (Browser → /api/search)
│
▼
Stage 4: City context validation (/api/search → loadCityBySlug)
│
▼
Stage 5: rpc_search execution (Supabase)
│  ├─ Stage 5a: tsquery construction
│  ├─ Stage 5b: Exact index scan (GIN + tsvector)
│  ├─ Stage 5c: Fuzzy supplement (pg_trgm, if needed)
│  └─ Stage 5d: Ranking & sorting
│
▼
Stage 6: Result shaping (Supabase → API route)
│
▼
Stage 7: Response delivery (API route → Browser)
│
▼
Stage 8: Result display (Browser)
│
▼
Stage 9: Navigation (Browser → Destination page)

## 3. Stage 1 — Input Capture & Debounce

**Component:** SearchBar (public UI component)
**Constraint:** Must use the `anon` Supabase client; must not fire on every keystroke.

The search bar is a controlled text input with the following behavior:

- User types in the search bar
- Input is debounced: the API call is not fired until the user has stopped typing for
  **300 ms**. This prevents excessive API calls during fast typing.
- Input is limited to **200 characters** client-side. Characters beyond 200 are not
  accepted by the input element (maxLength = 200).
- The search bar does not auto-submit on focus or on load.
- Submission is triggered by:
  - Pressing Enter
  - Clicking the search button
  - (Future) selecting an autocomplete suggestion
- On submission, the query is written to the URL as `?q=[encoded_query]` using
  `router.push` or `router.replace` (Next.js App Router). This ensures the search state
  is shareable and browser-history-navigable.

**ADA requirements at this stage:**
- Input has `aria-label="Search [City Name] civic content"`
- Submit button has `aria-label="Submit search"`
- Container has `role="search"`
- Loading state begins on submission: `aria-busy="true"` is set on the results container

---

## 4. Stage 2 — Query Normalization

**Component:** Shared utility `normalizeSearchQuery()` — runs in the browser before
the API call and server-side in /api/search for validation. Both runs must produce
identical output.

Normalization steps, in order:

### 4.1 Trim

query = query.trim();

### 4.2 Unicode normalization

query = query.normalize('NFC');