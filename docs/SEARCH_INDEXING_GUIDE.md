# SEARCH_INDEXING_GUIDE.md

**Electrum — Civic Atlas Search Index Construction & Maintenance Guide**
*Compatibility: DATA_MODEL.md · SEARCH_MODEL.md · CONTRIBUTING.md · ARCHITECTURE.md*
*Audience: Workspace, migration engineers, backend contributors*
*Last updated: 2026-10-13*

---

## 1. Purpose & Scope

### 1.1 Why Electrum Uses a Unified Search Index

Electrum's civic content lives across eight source tables (civic_stories, civic_entities,
civic_events, civic_places, civic_moments, civic_artifacts, civic_neighborhoods, civic_eras)
plus three additional searchable domains (games, cities, contributors). Querying these
tables directly from a public search endpoint would:

- Violate the RLS-safe public API contract — source tables have complex eligibility gates
  that differ by type
- Require expensive JOIN and UNION operations at query time
- Couple search ranking to source-table schema — any civic table refactor would break search
- Expose internal fields (review_status, safety_hold, is_frozen) to query-time logic

The `search_index` table is a **materialized read model**: a single, flat, pre-computed
table containing exactly the fields needed to rank, display, and route search results.
It is populated by triggers on source tables and rebuilt on demand by RPCs. It is never
the source of truth; it only reflects what is currently eligible and published.

### 1.2 Covered Entity Types

| entity_type | Source table(s) | Eligibility gate |
|---|---|---|
| story | civic_stories | review_status = 'published' AND safety_hold = false AND is_published = true |
| object | civic_entities, civic_events, civic_places, civic_moments, civic_artifacts, civic_neighborhoods, civic_eras | is_published = true |
| game | games | is_published = true |
| city | cities | No gate; all cities indexed |
| codex | civic_eras | is_published = true |
| timeline | cities (one row per city) | No gate |
| contributor | contributors | is_published = true (or equivalent active flag) |

### 1.3 Excluded from the Index

The following are never indexed. Adding them requires a spec revision to SEARCH_MODEL.md §1.3
and DATA_MODEL.md, plus CEO approval (CEO_WORKFLOW.md §13.4).

- Any sponsorship table (sponsors, sponsor_profiles, sponsorship_campaigns,
  sponsorship_placements, creative_assets)
- Draft civic content (is_published = false)
- Safety-held stories (safety_hold = true)
- Raw ingestion payloads (raw_ingestion)
- Admin-only tables (admin_action_logs, security_audit_log, production_units)
- Archived panoramas or hotspots

---

## 2. Index Table Definition

### 2.1 search_index (canonical reference)

The full schema is defined in SEARCH_MODEL.md §3.2. This section provides the Workspace-
facing summary needed for scaffolding and migration generation.

```sql
CREATE TABLE search_index (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT         NOT NULL
                     CHECK (entity_type IN (
                       'story','object','timeline','codex',
                       'game','city','contributor'
                     )),
  entity_id        UUID         NOT NULL,
  city_id          UUID         NOT NULL REFERENCES cities(id),
  title            TEXT         NOT NULL,
  subtitle         TEXT,
  summary          TEXT,
  keywords         TEXT[]       NOT NULL DEFAULT '{}',
  thumbnail_url    TEXT,
  route            TEXT         NOT NULL,
  search_vector    TSVECTOR     NOT NULL,
  entity_weight    NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  is_published     BOOLEAN      NOT NULL DEFAULT false,
  facet            TEXT         NOT NULL DEFAULT 'primary',
  source_updated_at TIMESTAMPTZ NOT NULL,
  indexed_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT search_index_entity_unique UNIQUE (entity_type, entity_id, facet)
);

GRANT SELECT ON public.search_index TO anon;

### 2.2 Required Extensions
sql


Copy
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fuzzy matching + autocomplete
CREATE EXTENSION IF NOT EXISTS unaccent;  -- accent-insensitive search (future)
-- pgvector added when semantic search ships (SEARCH_MODEL.md §13.2)
2.3 Required Indexes
sql


Copy
-- Full-text GIN index — primary search path
CREATE INDEX idx_search_index_vector
  ON search_index USING GIN (search_vector);

-- Trigram index — fuzzy matching and future autocomplete
CREATE INDEX idx_search_index_title_trgm
  ON search_index USING GIN (title gin_trgm_ops);

-- City-scoped query fast path
CREATE INDEX idx_search_index_city_id
  ON search_index (city_id);

-- Published-only reads (anon fast path)
CREATE INDEX idx_search_index_published
  ON search_index (city_id, entity_type)
  WHERE is_published = true;

-- Recency ranking
CREATE INDEX idx_search_index_recency
  ON search_index (city_id, source_updated_at DESC)
  WHERE is_published = true;

## 3. Index Construction Rules
### 3.1 Field Extraction per Entity Type
Workspace uses the following extraction rules to populate search_index rows. These rules
are the authoritative mapping between source fields and index fields. All field mappings
are implemented in rpc_reindex_entity (SEARCH_MODEL.md §9.2).

#### 3.1.1 story (civic_stories)
Index field	Source field	Notes
title	civic_stories.title	Direct copy
subtitle	civic_stories.category	e.g. 'Investigation', 'Feature'
summary	civic_stories.summary	Truncated to 280 chars
keywords	civic_stories.tags	Array copy
thumbnail_url	civic_stories.hero_image_url	
route	/stories/[slug]	Constructed at index time
entity_weight	1.00	Highest civic signal
is_published	review_status = 'published' AND safety_hold = false AND is_published = true	All three must be true
source_updated_at	civic_stories.updated_at	


#### 3.1.2 object (civic_entities)
Index field	Source field	Notes
title	civic_entities.name	
subtitle	civic_entities.entity_type	
summary	civic_entities.description	Truncated to 280 chars
keywords	civic_entities.tags	
thumbnail_url	civic_entities.thumbnail_url	
route	/entities/[slug]	
entity_weight	0.90	


#### 3.1.3 object (civic_events)
Index field	Source field	Notes
title	civic_events.name	
subtitle	civic_events.event_type	
summary	civic_events.description	Truncated to 280 chars
keywords	civic_events.tags	
thumbnail_url	civic_events.thumbnail_url	
route	/events/[slug]	
entity_weight	0.90	


#### 3.1.4 object (civic_places)
Index field	Source field	Notes
title	civic_places.name	
subtitle	civic_places.place_type	
summary	civic_places.description	Truncated to 280 chars
keywords	civic_places.tags	
thumbnail_url	civic_places.thumbnail_url	
route	/places/[slug]	
entity_weight	0.90	


#### 3.1.5 object (civic_moments)
Index field	Source field	Notes
title	civic_moments.title	
subtitle	civic_moments.moment_type	
summary	civic_moments.description	Truncated to 280 chars
keywords	civic_moments.tags	
thumbnail_url	NULL	Moments have no thumbnail in v1
route	/moments/[slug]	
entity_weight	0.90	


#### 3.1.6 object (civic_artifacts)
Index field	Source field	Notes
title	civic_artifacts.title	
subtitle	civic_artifacts.artifact_type	
summary	civic_artifacts.description	Truncated to 280 chars
keywords	civic_artifacts.tags	
thumbnail_url	civic_artifacts.media_url	
route	/artifacts/[slug]	
entity_weight	0.90	


#### 3.1.7 object (civic_neighborhoods)
Index field	Source field	Notes
title	civic_neighborhoods.name	
subtitle	'Neighborhood'	Static label
summary	civic_neighborhoods.description	Truncated to 280 chars
keywords	civic_neighborhoods.tags	
thumbnail_url	NULL	
route	/neighborhoods/[slug]	
entity_weight	0.90	


#### 3.1.8 object (civic_eras) — also codex
civic_eras produces two search_index rows with different facets:

facet	entity_type	route	subtitle
'primary'	'object'	/eras/[slug]	'Era'
'codex'	'codex'	/codex/[slug]	'Codex'


Both rows are inserted/updated by rpc_reindex_entity when entity_type = 'object' and the
source table is civic_eras. The UNIQUE constraint is on (entity_type, entity_id, facet),
so both rows coexist without conflict.

#### 3.1.9 game (games)
Index field	Source field	Notes
title	games.title	
subtitle	'Game'	Static label
summary	games.description	Truncated to 280 chars
keywords	[]	No tags in v1 games schema
thumbnail_url	NULL	
route	/games/[slug]	
entity_weight	0.60	


#### 3.1.10 city (cities) — also timeline
cities produces two rows:

facet	entity_type	route	title suffix	entity_weight
'primary'	'city'	/	none	0.40
'timeline'	'timeline'	/timeline	' Timeline'	0.70


#### 3.1.11 contributor (contributors)
Index field	Source field	Notes
title	contributors.display_name	
subtitle	'Contributor'	Static label
summary	contributors.bio	Truncated to 280 chars
keywords	[]	
thumbnail_url	contributors.avatar_url	
route	/contributors/[slug]	
entity_weight	0.50	

### 3.2 search_vector Construction

search_vector = (
  setweight(to_tsvector('english', COALESCE(title, '')),                            'A') ||
  setweight(to_tsvector('english', COALESCE(summary, '')),                          'B') ||
  setweight(to_tsvector('english', array_to_string(COALESCE(keywords, '{}'), ' ')), 'C')
)
Weight A (title): highest signal; exact title match scores ≥ 0.8

Weight B (summary): medium signal; body relevance

Weight C (keywords): supporting signal; capped contribution

search_vector is always computed at index time. It is never computed at query time.

### 3.3 Upsert Pattern
All index writes use INSERT ... ON CONFLICT DO UPDATE:

INSERT INTO search_index (
  entity_type, entity_id, city_id, title, subtitle, summary,
  keywords, thumbnail_url, route, search_vector, entity_weight,
  is_published, facet, source_updated_at, indexed_at
)
VALUES ( ... )
ON CONFLICT (entity_type, entity_id, facet)
DO UPDATE SET
  title             = EXCLUDED.title,
  subtitle          = EXCLUDED.subtitle,
  summary           = EXCLUDED.summary,
  keywords          = EXCLUDED.keywords,
  thumbnail_url     = EXCLUDED.thumbnail_url,
  route             = EXCLUDED.route,
  search_vector     = EXCLUDED.search_vector,
  entity_weight     = EXCLUDED.entity_weight,
  is_published      = EXCLUDED.is_published,
  source_updated_at = EXCLUDED.source_updated_at,
  indexed_at        = NOW();
Never DELETE and re-INSERT. The upsert pattern preserves row history and avoids
index fragmentation.

## 4. Triggers
### 4.1 Source Table → search_index Sync Triggers
Each source table has an AFTER INSERT OR UPDATE OR DELETE trigger that calls
fn_sync_search_index(), which dispatches to rpc_reindex_entity. See SEARCH_MODEL.md §3.7
for the full trigger function definition.

Source table	Trigger name
civic_stories	trg_sync_search_civic_stories
civic_entities	trg_sync_search_civic_entities
civic_events	trg_sync_search_civic_events
civic_places	trg_sync_search_civic_places
civic_moments	trg_sync_search_civic_moments
civic_artifacts	trg_sync_search_civic_artifacts
civic_neighborhoods	trg_sync_search_civic_neighborhoods
civic_eras	trg_sync_search_civic_eras
games	trg_sync_search_games
cities	trg_sync_search_cities
contributors	trg_sync_search_contributors


### 4.2 Eligibility Change Handling
When a source record transitions to ineligible (is_published → false, safety_hold → true,
review_status changed from 'published'):

-- Within fn_sync_search_index, on DELETE or ineligibility transition:
UPDATE search_index
SET    is_published = false, indexed_at = NOW()
WHERE  entity_id   = OLD.id
  AND  entity_type = v_entity_type;
-- Row is preserved; is_published = false excludes it from anon RLS

The row is never hard-deleted by the trigger. This preserves the index entry for
re-publication without a full rebuild. Hard deletion of search_index rows is never
performed by application code; it is a maintenance operation only.

### 4.3 Trigger Ordering
Source table triggers run AFTER the source table write is committed. This means:

The trigger fires after RETURNING values are available

search_index is always slightly behind the source table (eventual consistency)

In practice the lag is sub-millisecond for trigger-based sync

## 5. RPCs
### 5.1 rpc_reindex_entity
Rebuilds the search_index row for a single source record. Called by triggers and
by City Admins/CEO via the Search Admin tool. Full definition in SEARCH_MODEL.md §9.2.

rpc_reindex_entity(p_entity_type text, p_entity_id uuid) RETURNS void
Workspace uses this RPC in:

Admin UI server actions when a City Admin manually triggers entity reindex

Ingestion normalization workers after a civic_* row is created

### 5.2 rpc_reindex_city
Rebuilds the entire search_index for one city. Loops over all source tables and calls
rpc_reindex_entity for every eligible row. Full definition in SEARCH_MODEL.md §9.3.

rpc_reindex_city(p_city_id uuid) RETURNS jsonb
-- Returns: { reindexed: n, city_id: uuid }

Workspace uses this RPC in:

Admin UI server actions when a City Admin or CEO triggers a full city rebuild

### 5.3 rpc_search
The public search entrypoint. Never called directly from public UI components;
always called via the /api/search API route. Full definition in SEARCH_MODEL.md §9.1.

rpc_search(
  p_query       text,
  p_city_id     uuid,
  p_entity_types text[]   DEFAULT NULL,
  p_limit       integer   DEFAULT 10,
  p_offset      integer   DEFAULT 0
) RETURNS jsonb

## 6. Index Refresh Rules
### 6.1 Incremental Updates (Trigger-Based)
Trigger-based sync (§4.1) handles all routine updates. No batch job is needed for
incremental updates in normal operation. Every INSERT, UPDATE, or DELETE on a source
table automatically updates the corresponding search_index row.

### 6.2 Full City Rebuild
A full city rebuild via rpc_reindex_city is required when:

Scenario	Who triggers
A new city is added to Electrum	CEO or automated provisioning script
A slug changes on a source record (route field stale)	City Admin or CEO
A bulk metadata import or migration changes source records without triggering row-level triggers	City Admin or CEO
A trigger was disabled during a migration and rows were modified	CEO
Index corruption is detected (is_published mismatch with source)	CEO
search_vector recomputation needed (e.g., stop word list changed)	City Admin or CEO


Full rebuilds are idempotent — running rpc_reindex_city twice produces the same result.

### 6.3 Scheduled Validation (Future)
A future cron job (Supabase pg_cron) will run nightly to detect stale search_index rows:

-- Detect stories where search_index.is_published = true
-- but civic_stories.is_published = false or safety_hold = true
SELECT si.entity_id
FROM   search_index si
JOIN   civic_stories cs ON cs.id = si.entity_id
WHERE  si.entity_type  = 'story'
  AND  si.is_published = true
  AND  (cs.is_published = false OR cs.safety_hold = true OR cs.review_status <> 'published');

Stale rows found by this job are corrected by calling rpc_reindex_entity for each.

The job is not part of v1; it is documented here for implementation planning.

### 6.4 Governance Constraints
Workspace must never disable source table triggers without CEO written approval.

Workspace must never truncate search_index without triggering a full rebuild of all cities.

Workspace must never write to search_index directly from application code; all writes
go through rpc_reindex_entity or rpc_reindex_city.

Workspace must never add sponsorship data to search_index under any circumstance.
See §7 and SEARCH_MODEL.md §7.

## 7. Brand Safety & Sponsorship Exclusion Rules
The following rules are unconditional. They apply regardless of feature flags, City Admin
configuration, or commercial decisions. No migration, RPC, or trigger may violate them.

Rule	Enforcement
No sponsorship table may be a source for search_index	entity_type CHECK constraint excludes all sponsor types
No creative_asset row may appear in search results	creative_assets is not a source table for any trigger
No sponsorship field may appear in any search_index column	The search_index schema has no sponsor FK or nullable sponsor field
search_vector must never include sponsor content	search_vector is computed only from title, summary, keywords — never from sponsor fields
rpc_search must never accept a sponsorship parameter	Function signature has no sponsor parameter; adding one requires spec revision
Entity weight must never be modified by sponsorship status	entity_weight is set by entity type, not by any sponsor or commercial signal


If any Workspace refactor, migration, or feature request would require violating any of
the above rules, Workspace must halt and surface the conflict to the CEO for resolution.
See CEO_WORKFLOW.md §13.4.

## 8. Future Expansion
### 8.1 Autocomplete
When autocomplete ships, no schema change is required. The idx_search_index_title_trgm
index already supports prefix queries. Add rpc_autocomplete as a new SECURITY DEFINER
function. See SEARCH_MODEL.md §13.1.

### 8.2 Semantic Search
Adds a search_embedding vector(1536) column to search_index. Requires pgvector extension.
Embeddings are computed by a Supabase Edge Function after each upsert and written back
to the column. See SEARCH_MODEL.md §13.2.

### 8.3 Multi-City Search
rpc_search gains p_city_ids uuid[] DEFAULT NULL. The entity_weight formula gains a
city_match_bonus component. No schema change to search_index required. See
SEARCH_MODEL.md §13.4.

### 8.4 Global Search
A root-level /search route searches all cities simultaneously. Requires a city_name
field on SearchResult. No schema change required; city metadata is already in the index
via the 'city' entity_type rows.

