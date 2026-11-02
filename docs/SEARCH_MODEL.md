# SEARCH_MODEL.md

**Electrum — Civic Atlas Search Subsystem**
*Compatibility: DATA_MODEL.md · ARCHITECTURE.md · CONTRIBUTING.md · OBJECT_PAGE_MODEL.md · STORY_PAGE_MODEL.md · PANORAMA_MODEL.md · HOTSPOT_MODEL.md*
*Last updated: 2026-10-12*

---

## 1. Purpose & Scope

### 1.1 What Electrum Search Is

Electrum Search is the city-scoped, full-text retrieval system that allows users to find civic content across all Electrum surfaces. It is designed to surface **civic memory** — objects, stories, timelines, games, and places — with results ranked by relevance, recency, and civic weight.

Search is a **read-only, public-facing subsystem**. It does not write to civic content tables. It does not influence editorial decisions. It does not interact with the sponsorship system. It does not surface administrative content.

Search is **not** a recommendation engine, a trending engine, or an advertising channel. It returns the most relevant civic content for a given query, nothing more.

### 1.2 Included Surfaces

The following surfaces are searchable. Each maps to one or more `entity_type` values in the `search_index` table (§3):

| Surface | entity_type | Source Table(s) |
|---|---|---|
| Stories | `story` | `civic_stories` |
| Civic Objects — Entities | `object` | `civic_entities` |
| Civic Objects — Events | `object` | `civic_events` |
| Civic Objects — Places | `object` | `civic_places` |
| Civic Objects — Moments | `object` | `civic_moments` |
| Civic Objects — Artifacts | `object` | `civic_artifacts` |
| Civic Objects — Neighborhoods | `object` | `civic_neighborhoods` |
| Civic Objects — Eras | `object` | `civic_eras` |
| Timeline | `timeline` | `civic_events` + `civic_eras` (aggregated view) |
| Codex | `codex` | `civic_eras` |
| Games | `game` | `games` |
| Atlas (city-level) | `city` | `cities` |
| City Home | `city` | `cities` + `city_brand_settings` |
| Contributors | `contributor` | `contributors` |

### 1.3 Excluded Surfaces

The following are explicitly excluded from search results. No future configuration may include them without a schema revision and a documented architectural decision.

| Excluded Surface | Reason |
|---|---|
| Sponsorship placements | Search must not be an advertising channel. See §7. |
| Creative assets | Sponsor-owned content; not civic memory. |
| Admin UI routes | Not accessible to `anon`. |
| Draft civic content | Only published content is indexed. |
| Safety-held stories | `safety_hold = true` rows are excluded at index time. |
| Terminated campaigns | No sponsorship entity of any kind is indexed. |
| Raw ingestion payloads | Internal staging data; not public. |
| AI cache / response logs | Internal system data. |
| Payout or budget records | Financial data; not public. |

### 1.4 Scope Boundary

Search is **city-scoped by default**. A query submitted within a city context (`/...`) searches only that city's indexed content. Global search (cross-city) is a future capability (§9.4) and is not part of v1.

Search is always performed against the `search_index` table, never against `civic_*` tables directly. This keeps public search queries fast, RLS-safe, and decoupled from the underlying civic schema.

---

## 2. Search Input Model

### 2.1 Search Bar Input

The search bar is a single plain-text input field. It accepts free-form user queries of up to **200 characters**. Inputs longer than 200 characters are truncated client-side before transmission.

The search bar is available on all city-scoped public pages as a persistent UI element. On `/atlas`, the search bar operates in global city-name search mode (see §9.4 for multi-city future plans).

### 2.2 Query Parsing

Queries are processed in the following sequence before being passed to `rpc_search`:

```
1. Trim leading and trailing whitespace
2. Normalize Unicode (NFC normalization)
3. Lowercase
4. Remove stop words (§2.4)
5. Tokenize on whitespace and punctuation boundaries (§2.3)
6. Apply fuzzy matching rules (§2.5)
7. Build PostgreSQL tsquery expression
```

The normalized, tokenized query is what is passed to the RPC. The original raw input is preserved client-side for display in the search bar but is never written to the database.

### 2.3 Tokenization

Tokens are split on:
- Whitespace (spaces, tabs, non-breaking spaces)
- Punctuation boundaries: `.` `,` `;` `:` `!` `?` `"` `'` `(` `)` `[` `]`
- Hyphen between tokens only when the hyphen is surrounded by word characters on both sides and the resulting tokens are each ≥ 2 characters. Example: `"city-hall"` → `["city", "hall"]`. Preserved as a single token when one side is a single character: `"e-mail"` → `["e-mail"]`.

Tokens of fewer than 2 characters after splitting are discarded unless the entire query is a single character (in which case the query is returned as-is and matched against prefix indexes only).

Minimum meaningful query length: **2 characters.**
Queries shorter than 2 characters after tokenization return an empty result set with no error.

### 2.4 Stop Words

The following English stop words are removed from queries before index matching. They carry no discriminative signal for civic content search:

```
a, an, the, and, or, but, in, on, at, to, for, of, with, by, from,
is, was, are, were, be, been, being, have, has, had, do, does, did,
it, its, this, that, these, those, which, who, what, where, when, how
```

Stop words are removed only when the query contains **more than one token** after tokenization. Single-token queries that happen to be a stop word are passed through unchanged (a user searching for "the" is an edge case; do not discard their query entirely).

Stop word lists are stored in `city_prompts.search_stop_words` (JSONB array) and can be extended per city. The global default list above applies when no city-level override is present.

### 2.5 Fuzzy Matching Rules

Electrum Search uses **PostgreSQL `pg_trgm`** trigram similarity for fuzzy matching, applied after exact `tsvector`/`tsquery` matching fails to return a sufficient result set.

| Condition | Behavior |
|---|---|
| Exact match (tsquery hit) | Return exact results; do not apply fuzzy |
| Zero exact results | Apply trigram similarity on `search_index.title` with similarity threshold ≥ 0.3 |
| Fewer than 3 exact results | Supplement with trigram matches (similarity ≥ 0.4) up to a total of 10 results |
| Query length ≤ 3 characters | No fuzzy matching; exact prefix match only |

Fuzzy matches are ranked below exact matches in all cases. The `relevance_score` field in the result model (§4) encodes whether a result came from an exact or fuzzy match.

Trigram matching operates on `search_index.title` only, not on `keywords` or `summary`. Extending fuzzy matching to other fields is a future capability (§9.2).

### 2.6 Autocomplete (Future-Ready)

Autocomplete is not implemented in v1. The `search_index` table is designed to support it:
- `search_index.title` is indexed with a `gin(title gin_trgm_ops)` index for prefix matching.
- A future `rpc_autocomplete(query text, city_id uuid, limit int)` RPC will query this index to return title prefix matches in < 50 ms.
- The `search_index.entity_type` field allows autocomplete results to be grouped by type in a typeahead dropdown.

No schema change is required when autocomplete ships. See §9.1 for the full autocomplete roadmap.

---

## 3. Search Index Model

### 3.1 Overview

The `search_index` table is a **materialized, denormalized read model**. It is never the source of truth for any field — all data originates in the underlying civic content tables. It exists solely to make public search fast, RLS-safe, and decoupled from the schema complexity of the civic domain.

The `search_index` is populated and maintained by triggers on source tables (§3.5) and by the `rpc_reindex_entity` and `rpc_reindex_city` RPCs (§3.6). It is never written by application code directly.

### 3.2 Table: search_index

The search index. Each row represents one indexable content item. A single source record may produce multiple rows if it has multiple indexable facets (not used in v1; reserved by the `facet` column).

| column_name | data_type | constraints | notes |
|---|---|---|---|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| entity_type | text | NOT NULL CHECK IN ('story','object','timeline','codex','game','city','contributor') | Determines routing and display treatment |
| entity_id | uuid | NOT NULL | FK to the source table row; resolved by entity_type |
| city_id | uuid | NOT NULL FK → cities(id) | RLS scoping key; MUST match source record city_id |
| title | text | NOT NULL | Human-readable title; primary match field |
| subtitle | text | | Secondary display line (category, type, date) |
| summary | text | | Truncated body text for result card preview (max 280 chars) |
| keywords | text[] | NOT NULL DEFAULT '{}' | Tags, entity types, era names, categorical labels |
| thumbnail_url | text | | Result card image |
| route | text | NOT NULL | Exact public URL for this result, e.g. /stories/the-last-mural |
| search_vector | tsvector | NOT NULL | Precomputed tsvector across title + summary + keywords |
| entity_weight | numeric(3,2) | NOT NULL DEFAULT 1.0 | Type-level ranking weight; see §5.3 |
| is_published | boolean | NOT NULL DEFAULT false | Gate; unpublished rows excluded from anon queries |
| facet | text | NOT NULL DEFAULT 'primary' | Reserved for multi-facet indexing; always 'primary' in v1 |
| source_updated_at | timestamptz | NOT NULL | Timestamp of the source record's last update; used for recency ranking |
| indexed_at | timestamptz | NOT NULL DEFAULT now() | Timestamp of last index write |

### 3.3 Indexing Rules

A source record is eligible for indexing when **all** of the following are true:

| Source Table | Eligibility Condition |
|---|---|
| civic_stories | `review_status = 'published'` AND `safety_hold = false` AND `is_published = true` |
| civic_entities | `is_published = true` |
| civic_events | `is_published = true` |
| civic_places | `is_published = true` |
| civic_moments | `is_published = true` |
| civic_artifacts | `is_published = true` |
| civic_neighborhoods | `is_published = true` |
| civic_eras | `is_published = true` |
| games | `is_published = true` (confirmed column name from games schema) |
| cities | No gate; all cities are indexed |
| contributors | `is_published = true` (or equivalent active flag) |

When a source record transitions out of eligibility (e.g., `safety_hold → true`, `is_published → false`), its `search_index` row is set to `is_published = false` by trigger. The row is not deleted; this allows re-indexing on re-publication without a full rebuild.

### 3.4 Field Population Rules

| entity_type | title | subtitle | summary | keywords | thumbnail_url | route |
|---|---|---|---|---|---|---|
| story | `civic_stories.title` | `civic_stories.category` | `civic_stories.summary` (first 280 chars) | `civic_stories.tags` | `civic_stories.hero_image_url` | /stories/[slug]` |
| object (entity) | `civic_entities.name` | `civic_entities.entity_type` | `civic_entities.description` (first 280 chars) | `civic_entities.tags` | `civic_entities.thumbnail_url` | '/entities/[slug]` |
| object (event) | `civic_events.name` | `civic_events.event_type` | `civic_events.description` (first 280 chars) | `civic_events.tags` | `civic_events.thumbnail_url` | `/events/[slug]` |
| object (place) | `civic_places.name` | `civic_places.place_type` | `civic_places.description` (first 280 chars) | `civic_places.tags` | `civic_places.thumbnail_url` | `/places/[slug]` |
| object (moment) | `civic_moments.title` | `civic_moments.moment_type` | `civic_moments.description` (first 280 chars) | `civic_moments.tags` | NULL | `/moments/[slug]` |
| object (artifact) | `civic_artifacts.title` | `civic_artifacts.artifact_type` | `civic_artifacts.description` (first 280 chars) | `civic_artifacts.tags` | `civic_artifacts.media_url` | `/artifacts/[slug]` |
| object (neighborhood) | `civic_neighborhoods.name` | 'Neighborhood' | `civic_neighborhoods.description` (first 280 chars) | `civic_neighborhoods.tags` | NULL | `/neighborhoods/[slug]` |
| object (era) | `civic_eras.name` | 'Era' | `civic_eras.description` (first 280 chars) | `civic_eras.tags` | NULL | `/eras/[slug]` |
| timeline | `cities.name + ' Timeline'` | 'Timeline' | NULL | [] | NULL | `/timeline` |
| game | `games.title` | 'Game' | `games.description` (first 280 chars) | [] | NULL | `/games/[slug]` |
| city | `cities.name` | 'City Home' | NULL | [] | NULL | `/` |
| contributor | `contributors.display_name` | 'Contributor' | `contributors.bio` (first 280 chars) | [] | `contributors.avatar_url` | `/contributors/[slug]` |

### 3.5 search_vector Construction

`search_vector` is a precomputed `tsvector` combining title, summary, and keywords with differential weights:

```sql
search_vector = (
  setweight(to_tsvector('english', COALESCE(title, '')),   'A') ||
  setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
  setweight(to_tsvector('english', array_to_string(keywords, ' ')), 'C')
)
```

| Weight | Source field | Signal strength |
|---|---|---|
| A | `title` | Highest — exact title match is the strongest signal |
| B | `summary` | Medium — body content relevance |
| C | `keywords` | Supporting — tags and categorical labels |

`search_vector` is computed and stored at index time. It is never computed at query time. This means `rpc_search` executes `search_vector @@ tsquery` against a pre-built GIN index — no per-query `to_tsvector` call.

### 3.6 Indexes

```sql
-- Primary full-text search index (GIN on tsvector)
CREATE INDEX idx_search_index_vector
  ON search_index USING GIN (search_vector);

-- Trigram index for fuzzy matching and autocomplete on title
CREATE INDEX idx_search_index_title_trgm
  ON search_index USING GIN (title gin_trgm_ops);

-- City-scoped queries (all search is city-scoped in v1)
CREATE INDEX idx_search_index_city_id
  ON search_index (city_id);

-- Entity lookup: "reindex this object" by (entity_type, entity_id)
CREATE UNIQUE INDEX idx_search_index_entity
  ON search_index (entity_type, entity_id, facet);

-- Published gate (anon read path)
CREATE INDEX idx_search_index_published
  ON search_index (city_id, entity_type)
  WHERE is_published = true;

-- Recency ranking support
CREATE INDEX idx_search_index_recency
  ON search_index (city_id, source_updated_at DESC)
  WHERE is_published = true;
```

### 3.7 Triggers — Source Table → search_index Sync

Each source table has an `AFTER INSERT OR UPDATE OR DELETE` trigger that calls `fn_sync_search_index()`. The trigger is identical in structure across all tables; the function uses `TG_TABLE_NAME` to determine the entity type and field mapping.

```sql
-- Generic sync dispatcher (one copy; all tables route here)
CREATE OR REPLACE FUNCTION fn_sync_search_index()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_entity_type  text;
  v_is_eligible  boolean;
  v_title        text;
  v_subtitle     text;
  v_summary      text;
  v_keywords     text[];
  v_thumb        text;
  v_route        text;
  v_city_slug    text;
  v_weight       numeric(3,2);
  v_source_ts    timestamptz;
BEGIN
  -- Resolve entity_type from source table name
  v_entity_type := CASE TG_TABLE_NAME
    WHEN 'civic_stories'       THEN 'story'
    WHEN 'civic_entities'      THEN 'object'
    WHEN 'civic_events'        THEN 'object'
    WHEN 'civic_places'        THEN 'object'
    WHEN 'civic_moments'       THEN 'object'
    WHEN 'civic_artifacts'     THEN 'object'
    WHEN 'civic_neighborhoods' THEN 'object'
    WHEN 'civic_eras'          THEN 'object'
    WHEN 'games'               THEN 'game'
    WHEN 'cities'              THEN 'city'
    WHEN 'contributors'        THEN 'contributor'
    ELSE NULL
  END;

  IF v_entity_type IS NULL THEN
    RAISE EXCEPTION 'fn_sync_search_index: unrecognised source table %', TG_TABLE_NAME;
  END IF;

  -- On DELETE: mark unpublished and return
  IF TG_OP = 'DELETE' THEN
    UPDATE search_index
    SET    is_published = false, indexed_at = NOW()
    WHERE  entity_id    = OLD.id
      AND  entity_type  = v_entity_type;
    RETURN OLD;
  END IF;

  -- Resolve city slug for route construction
  SELECT slug INTO v_city_slug FROM cities WHERE id = NEW.city_id;

  -- Field mapping and eligibility per table is handled by
  -- rpc_reindex_entity (SECURITY DEFINER), called here for consistency.
  -- Inline mapping is used only for INSERT speed; rpc_reindex_entity
  -- is the authoritative reindex path for admin-triggered rebuilds.
  PERFORM rpc_reindex_entity(v_entity_type, NEW.id);

  RETURN NEW;
END;
$$;

-- Apply to each source table:
CREATE TRIGGER trg_sync_search_civic_stories
  AFTER INSERT OR UPDATE OR DELETE ON civic_stories
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_civic_entities
  AFTER INSERT OR UPDATE OR DELETE ON civic_entities
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_civic_events
  AFTER INSERT OR UPDATE OR DELETE ON civic_events
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_civic_places
  AFTER INSERT OR UPDATE OR DELETE ON civic_places
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_civic_moments
  AFTER INSERT OR UPDATE OR DELETE ON civic_moments
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_civic_artifacts
  AFTER INSERT OR UPDATE OR DELETE ON civic_artifacts
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_civic_neighborhoods
  AFTER INSERT OR UPDATE OR DELETE ON civic_neighborhoods
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_civic_eras
  AFTER INSERT OR UPDATE OR DELETE ON civic_eras
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_games
  AFTER INSERT OR UPDATE OR DELETE ON games
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_cities
  AFTER INSERT OR UPDATE OR DELETE ON cities
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();

CREATE TRIGGER trg_sync_search_contributors
  AFTER INSERT OR UPDATE OR DELETE ON contributors
  FOR EACH ROW EXECUTE FUNCTION fn_sync_search_index();
```

### 3.8 DATA_MODEL.md Additions Required

The following must be added to `DATA_MODEL.md` when this spec is implemented:

**§2 Table Overview — add new group:**
```
Search Tables
•  search_index
```

**§6 Foreign Key Map — add §6.x Search Domain:**
```
search_index.city_id   → cities.id
search_index.entity_id → (polymorphic; resolved by entity_type; no DB-level FK)
```

**§14.3 Canonical action strings — add search domain row:**
```
| search | search_index_rebuilt, search_index_entity_reindexed, search_config_updated |
```

---

## 4. Search Result Model

### 4.1 Result Shape

Each search result returned by `rpc_search` has the following shape. This is the canonical contract between the database layer and all search UI components. No UI component may query `search_index` directly; all search results arrive through `rpc_search`.

```ts
interface SearchResult {
  result_id:        string;   // UUID — search_index.entity_id
  result_type:      string;   // search_index.entity_type
  title:            string;   // search_index.title
  subtitle:         string | null;  // search_index.subtitle
  summary:          string | null;  // search_index.summary (max 280 chars)
  thumbnail_url:    string | null;  // search_index.thumbnail_url
  city_id:          string;   // UUID — search_index.city_id
  route:            string;   // search_index.route — exact navigation path
  relevance_score:  number;   // float 0.0–1.0; higher = more relevant
  match_type:       'exact' | 'fuzzy';  // whether result came from tsquery or trigram
}
```

### 4.2 Result Set Shape

```ts
interface SearchResponse {
  query:          string;         // The normalized query string after processing (§2.2)
  city_id:        string;         // UUID of the city searched
  total:          number;         // Total matching rows (before limit)
  results:        SearchResult[];
  has_more:       boolean;        // true when total > results.length
  next_offset:    number | null;  // Pagination offset for the next page; null if no more
}
```

### 4.3 Pagination

Default page size: **10 results**.
Maximum page size: **20 results** (enforced server-side in `rpc_search`).
Pagination is offset-based in v1. Cursor-based pagination is reserved for future implementation (§9.5).

### 4.4 Empty Results

When no results are found (after both exact and fuzzy matching), `rpc_search` returns:

```json
{
  "query": "...",
  "city_id": "...",
  "total": 0,
  "results": [],
  "has_more": false,
  "next_offset": null
}
```

Empty results must never be treated as an error. The UI renders an empty state with a "No results for [query]" message. No error is thrown, logged, or written to `admin_action_logs`.

---

## 5. Ranking & Relevance

### 5.1 Ranking Model

Results are ranked using a composite score:

```
relevance_score = (
  title_weight    × title_match_score    +
  keyword_weight  × keyword_match_score  +
  city_weight     × city_match_bonus     +
  recency_weight  × recency_score        +
  entity_weight   × entity_type_weight
) / normalization_factor
```

All weight constants are defined in `city_prompts.search_ranking_weights` (JSONB). Default values are defined in §5.2 and apply when no city-level override is present.

### 5.2 Weight Defaults

| Weight constant | Default | Description |
|---|---|---|
| `title_weight` | 0.50 | Share of score from title match quality |
| `keyword_weight` | 0.20 | Share from keyword/tag match |
| `city_weight` | 0.10 | Bonus for result being in the searched city |
| `recency_weight` | 0.10 | Bonus for recently updated content |
| `entity_weight` | 0.10 | Bonus from entity-type baseline weight |

Weights must sum to 1.0. `rpc_reindex_city` validates the sum before accepting a config update.

### 5.3 Title Match Score

Computed by PostgreSQL `ts_rank_cd(search_vector, query)` against the `A`-weighted title component of the vector. Score range: 0.0–1.0.

- Exact phrase match in title → score ≥ 0.8
- All query tokens present in title → score ≥ 0.5
- Partial token match in title → score proportional to token coverage

### 5.4 Keyword Match Score

Computed by `ts_rank(search_vector, query)` against the `C`-weighted keyword component. Score range: 0.0–1.0.

Keyword match scores are capped at `0.5 × keyword_weight` to prevent keyword-stuffed content from outranking title matches.

### 5.5 City Match Bonus

A flat bonus applied when `search_index.city_id = :searched_city_id`. Always `1.0` in v1 because v1 search is city-scoped and every result is by definition within the searched city. This field is reserved for multi-city search (§9.4), where cross-city results receive a penalty here.

### 5.6 Recency Score

```sql
recency_score = GREATEST(
  0.0,
  1.0 - (EXTRACT(EPOCH FROM (NOW() - source_updated_at)) / 31536000.0)
)
-- Decays linearly from 1.0 (updated now) to 0.0 (updated 1 year ago or more)
```

Stories that have been recently published or edited rank higher than stale content. The decay function is linear over 365 days; content older than 1 year receives a recency score of 0.0.

### 5.7 Entity-Type Baseline Weights

Different content types carry different default relevance weights. These reflect the editorial priority of each type in the Electrum civic model:

| entity_type | entity_type_weight | Rationale |
|---|---|---|
| `story` | 1.00 | Editorial content; highest civic signal |
| `object` | 0.90 | Civic record; foundational civic memory |
| `codex` | 0.80 | Era-level narrative; high contextual value |
| `timeline` | 0.70 | Aggregated view; less specific than object |
| `game` | 0.60 | Civic engagement; important but secondary |
| `contributor` | 0.50 | People index; useful but not primary content |
| `city` | 0.40 | Navigation entry point; matched only when query matches city name |

Entity-type weights are stored in `city_prompts.search_entity_weights` (JSONB) and can be overridden per city.

### 5.8 Tie-Breaking Rules

When two results have equal `relevance_score` (after rounding to 4 decimal places), they are ordered by:

1. `entity_type_weight` descending (higher-priority entity type first)
2. `source_updated_at` descending (more recently updated first)
3. `title` ascending (alphabetical; deterministic)

---

## 6. Routing Integration

### 6.1 Route Field

Every `search_index` row carries an exact, pre-computed `route` value. Routes are computed at index time from the source record's `city_id` → `cities.slug` and the source record's `slug`. They are stored as absolute path strings beginning with `/`.

Routes are never computed at query time. If a slug changes, `rpc_reindex_entity` recomputes and updates the `route` field.

### 6.2 Route Map

| entity_type | Source object type | route pattern | Example |
|---|---|---|---|
| story | civic_stories | `/stories/[slug]` | `/stories/the-last-mural` |
| object | civic_entities | `/entities/[slug]` | `/entities/huey-newton` |
| object | civic_events | `/events/[slug]` | `/events/port-chicago-disaster` |
| object | civic_places | `/places/[slug]` | `/places/lake-merritt` |
| object | civic_moments | `/moments/[slug]` | `/moments/general-strike-1946` |
| object | civic_artifacts | `/artifacts/[slug]` | `/artifacts/california-proclamation` |
| object | civic_neighborhoods | `/neighborhoods/[slug]` | `/neighborhoods/sample-neighborhood` |
| object | civic_eras | `/eras/[slug]` | `/eras/reconstruction` |
| timeline | cities | `/timeline` | `/timeline` |
|
| game | games | `/games/[slug]` | `/games/civic-trivia` |
| city | cities | `` | `/` |
| contributor | contributors | `/contributors/[slug]` | `/contributors/jane-doe` |

### 6.3 Route Integrity

When the public UI navigates to a `route` from a search result, it must call `loadCityBySlug` as the first loader operation (`CONTRIBUTING.md §3.1`). The `route` field guarantees the path is valid at index time; it does not guarantee the resource still exists at navigation time. The destination page is responsible for handling 404s gracefully when a record has been unpublished since indexing.

### 6.4 Stale Route Detection

When `rpc_reindex_entity` is called for a record that has become ineligible (unpublished, safety-held, deleted), it sets `search_index.is_published = false`. The route field is preserved for audit purposes but the row is excluded from all `anon` queries via RLS. Stale routes never surface to end users.

---

## 7. Sponsorship Interaction

Electrum Search is a **sponsor-free zone**. This section defines the hard boundary between the search subsystem and the sponsorship system. No exception to these rules may be implemented without a documented architectural decision and a revision to this spec.

### 7.1 Rules

| Rule | Enforcement mechanism |
|---|---|
| Search results must never include sponsorship placements | `entity_type` CHECK constraint excludes all sponsor entity types |
| Search results must never include creative assets | `entity_type` CHECK constraint; no creative asset table is a source for `search_index` |
| Search ranking must never be influenced by sponsorship | Weight constants are stored in `city_prompts`, never in sponsorship tables |
| Sponsored content may not purchase higher ranking | `rpc_search` does not accept any sponsorship parameter |
| `rpc_get_active_sponsorships` must not be called from search paths | Enforced by code convention; search RPCs have no sponsorship dependency |
| Search results must not carry sponsor metadata | The `SearchResult` shape has no sponsor field; adding one requires a spec revision |
| Search must not be gated or filtered by campaign status | `search_index` rows have no campaign linkage |

### 7.2 Why This Boundary Exists

Electrum is a civic memory platform. Its search results are a public trust artifact. Users searching for civic content must receive results ranked solely by civic relevance. Introducing sponsorship signals into search ranking — even indirectly — would compromise the platform's editorial integrity and undermine user trust.

This boundary is unconditional. It applies regardless of commercial pressure, feature requests, or City Admin configuration. The `rpc_search` function signature does not accept a sponsor parameter, and no future version of the RPC may add one without first revising this spec and `DATA_MODEL.md`.

### 7.3 Sponsor Search (Future)

§9.6 documents the conditions under which a separate, explicitly-labelled sponsor discovery surface may be built. It would be a distinct RPC (`rpc_search_sponsors`), a distinct UI surface, and would not share the `search_index` table or any search ranking logic with civic search.

---

## 8. ADA & UX Requirements

### 8.1 Keyboard Navigation

| Interaction | Required Behavior |
|---|---|
| `Tab` to search bar | Focus ring visible; ARIA role `search`; label "Search [City Name]" |
| Type query | No auto-submit; user must press Enter or click the submit button |
| `Enter` | Submits query; navigates to `/search?q=[query]` |
| `Escape` | Clears the search input and dismisses any autocomplete dropdown |
| Arrow Down / Up in results | Moves focus through result cards sequentially |
| `Enter` on a focused result | Navigates to `result.route` |
| `Tab` through result cards | Focus advances through interactive elements within each card |
| No results state | Focus moves to the "No results" message; the message has `role="status"` |

### 8.2 Screen Reader Labels

| Element | ARIA annotation |
|---|---|
| Search container | `role="search"` |
| Search input | `aria-label="Search [City Name] civic content"` |
| Submit button | `aria-label="Submit search"` |
| Result list | `role="list"` |
| Each result card | `role="listitem"`; `aria-label="[title], [entity_type], [subtitle]"` |
| Result thumbnail | `alt="[title] thumbnail"` or `alt=""` when decorative |
| Result route link | `aria-label="Go to [title]"` |
| Loading state | `aria-live="polite"` region announces "Searching..." then result count |
| Empty state | `role="status"`; announces "No results for [query]" |
| Pagination | `aria-label="Load more results"` |

### 8.3 High-Contrast Mode

- The search bar, result cards, and result type badges must all pass WCAG 2.1 AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text).
- The search bar focus ring must be visible in Windows High Contrast mode and macOS increased contrast mode.
- Result type badges (entity_type labels) must not rely on color alone to communicate type — they must include a text label or icon with `aria-label`.
- `city_design_system.published_theme` color tokens (`colors.foreground`, `colors.background`, `colors.accent`) are used for search result theming. Components must not hardcode colors.
- A forced-colors media query stylesheet must be provided for the search results page.

### 8.4 Mobile-First Behavior

| Behavior | Requirement |
|---|---|
| Search bar position | Persistent top-of-page on mobile; collapses to icon on screens < 375 px if layout requires |
| Touch target size | Minimum 44 × 44 px for search bar, submit button, and result cards |
| Result card layout | Single column on mobile (< 768 px); two-column grid on tablet (768–1023 px); three-column on desktop (≥ 1024 px) |
| Thumbnail aspect ratio | 16:9, width-constrained; never cropped to a height that obscures text on cards |
| Scroll behavior | Result list is scrollable; no horizontal scroll |
| Keyboard on mobile | On focus of search bar, mobile keyboard opens; page does not jump or reflow |
| Autocomplete (future) | Renders as a full-width overlay sheet on mobile, not a floating dropdown |
| Empty state | Centered, single-column, with accessible message and a "Clear search" link |

---

## 9. RPCs

### 9.1 rpc_search

Primary search entry point. Called by all public search surfaces. Never called with a sponsorship parameter. Returns the `SearchResponse` shape (§4.2).

```sql
CREATE OR REPLACE FUNCTION rpc_search(
  p_query      text,
  p_city_id    uuid,
  p_entity_types text[]   DEFAULT NULL,   -- NULL = all types
  p_limit      integer    DEFAULT 10,
  p_offset     integer    DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tsquery      tsquery;
  v_results      jsonb;
  v_total        integer;
  v_has_more     boolean;
  v_exact_count  integer;
BEGIN
  -- Clamp limit
  p_limit := LEAST(p_limit, 20);

  -- Build tsquery from normalized query string
  BEGIN
    v_tsquery := plainto_tsquery('english', p_query);
  EXCEPTION WHEN OTHERS THEN
    -- Malformed query: return empty result set
    RETURN jsonb_build_object(
      'query', p_query, 'city_id', p_city_id,
      'total', 0, 'results', '[]'::jsonb,
      'has_more', false, 'next_offset', null
    );
  END;

  -- Count total matching rows
  SELECT COUNT(*) INTO v_total
  FROM search_index
  WHERE city_id     = p_city_id
    AND is_published = true
    AND (p_entity_types IS NULL OR entity_type = ANY(p_entity_types))
    AND search_vector @@ v_tsquery;

  -- Fetch ranked results
  SELECT jsonb_agg(r ORDER BY r.relevance_score DESC)
  INTO   v_results
  FROM (
    SELECT
      entity_id                              AS result_id,
      entity_type                            AS result_type,
      title,
      subtitle,
      summary,
      thumbnail_url,
      city_id,
      route,
      ROUND(
        (
          ts_rank_cd(search_vector, v_tsquery) * 0.50 +
          ts_rank(search_vector, v_tsquery)    * 0.20 +
          entity_weight                        * 0.10 +
          GREATEST(0.0, 1.0 - (
            EXTRACT(EPOCH FROM (NOW() - source_updated_at)) / 31536000.0
          ))                                   * 0.10 +
          0.10  -- city match bonus (always 1.0 in city-scoped v1)
        )::numeric,
      4)                                     AS relevance_score,
      'exact'                                AS match_type
    FROM search_index
    WHERE city_id      = p_city_id
      AND is_published = true
      AND (p_entity_types IS NULL OR entity_type = ANY(p_entity_types))
      AND search_vector @@ v_tsquery
    ORDER BY relevance_score DESC,
             entity_weight    DESC,
             source_updated_at DESC,
             title             ASC
    LIMIT  p_limit
    OFFSET p_offset
  ) r;

  -- Fuzzy supplement when exact results are sparse
  GET DIAGNOSTICS v_exact_count = ROW_COUNT;

  IF v_exact_count < 3 THEN
    SELECT jsonb_agg(r ORDER BY r.relevance_score DESC)
    INTO v_results
    FROM (
      SELECT
        entity_id      AS result_id,
        entity_type    AS result_type,
        title,
        subtitle,
        summary,
        thumbnail_url,
        city_id,
        route,
        ROUND((similarity(title, p_query) * 0.50 + entity_weight * 0.10)::numeric, 4)
                       AS relevance_score,
        'fuzzy'        AS match_type
      FROM search_index
      WHERE city_id         = p_city_id
        AND is_published    = true
        AND (p_entity_types IS NULL OR entity_type = ANY(p_entity_types))
        AND similarity(title, p_query) >= 0.3
        AND NOT (search_vector @@ v_tsquery)  -- exclude already-found exact results
      ORDER BY relevance_score DESC
      LIMIT  GREATEST(0, p_limit - v_exact_count)
    ) r;
  END IF;

  v_has_more := (v_total > p_offset + p_limit);

  RETURN jsonb_build_object(
    'query',       p_query,
    'city_id',     p_city_id,
    'total',       v_total,
    'results',     COALESCE(v_results, '[]'::jsonb),
    'has_more',    v_has_more,
    'next_offset', CASE WHEN v_has_more THEN p_offset + p_limit ELSE null END
  );
END;
$$;
```

### 9.2 rpc_reindex_entity

Rebuilds the `search_index` row for a single source record. Called by triggers (§3.7) and by City Admins via the admin UI when manual reindexing is needed.

```sql
CREATE OR REPLACE FUNCTION rpc_reindex_entity(
  p_entity_type text,
  p_entity_id   uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_city_slug    text;
  v_title        text;
  v_subtitle     text;
  v_summary_raw  text;
  v_keywords     text[];
  v_thumb        text;
  v_route        text;
  v_city_id      uuid;
  v_weight       numeric(3,2);
  v_is_pub       boolean;
  v_source_ts    timestamptz;
BEGIN
  -- Field resolution is implemented per entity_type.
  -- Each branch SELECTs from the source table and populates local variables.
  -- upsert into search_index follows all branches.

  IF p_entity_type = 'story' THEN
    SELECT
      cs.city_id, cs.title, cs.category, cs.summary, cs.tags,
      cs.hero_image_url, cs.slug,
      (cs.review_status = 'published' AND cs.safety_hold = false AND cs.is_published = true),
      cs.updated_at,
      c.slug
    INTO v_city_id, v_title, v_subtitle, v_summary_raw, v_keywords,
         v_thumb, v_route, v_is_pub, v_source_ts, v_city_slug
    FROM civic_stories cs JOIN cities c ON c.id = cs.city_id
    WHERE cs.id = p_entity_id;

    v_route  := '/' || v_city_slug || '/stories/' || v_route;
    v_weight := 1.00;

  ELSIF p_entity_type = 'object' THEN
    -- Resolved per sub-type; abbreviated here for readability.
    -- Each civic_* table branch sets v_subtitle, v_route segment, and v_weight.
    v_weight := 0.90;

  ELSIF p_entity_type = 'game' THEN
    SELECT g.city_id, g.title, g.description, g.slug, g.is_published, g.updated_at, c.slug
    INTO   v_city_id, v_title, v_summary_raw, v_route, v_is_pub, v_source_ts, v_city_slug
    FROM   games g JOIN cities c ON c.id = g.city_id
    WHERE  g.id = p_entity_id;

    v_route    := '/' || v_city_slug || '/games/' || v_route;
    v_subtitle := 'Game';
    v_keywords := '{}';
    v_weight   := 0.60;

  ELSIF p_entity_type = 'city' THEN
    SELECT id, name, slug, NOW()
    INTO   v_city_id, v_title, v_city_slug, v_source_ts
    FROM   cities WHERE id = p_entity_id;

    v_route    := '/' || v_city_slug;
    v_subtitle := 'City Home';
    v_keywords := '{}';
    v_is_pub   := true;
    v_weight   := 0.40;

  ELSIF p_entity_type = 'contributor' THEN
    v_weight := 0.50;
  END IF;

  -- Upsert search_index row
  INSERT INTO search_index (
    entity_type, entity_id, city_id, title, subtitle, summary,
    keywords, thumbnail_url, route, search_vector, entity_weight,
    is_published, source_updated_at, indexed_at
  )
  VALUES (
    p_entity_type, p_entity_id, v_city_id,
    v_title, v_subtitle, LEFT(v_summary_raw, 280),
    v_keywords, v_thumb, v_route,
    (
      setweight(to_tsvector('english', COALESCE(v_title, '')),  'A') ||
      setweight(to_tsvector('english', COALESCE(LEFT(v_summary_raw, 280), '')), 'B') ||
      setweight(to_tsvector('english', array_to_string(COALESCE(v_keywords,'{}'), ' ')), 'C')
    ),
    v_weight, v_is_pub, v_source_ts, NOW()
  )
  ON CONFLICT (entity_type, entity_id, facet)
  DO UPDATE SET
    city_id          = EXCLUDED.city_id,
    title            = EXCLUDED.title,
    subtitle         = EXCLUDED.subtitle,
    summary          = EXCLUDED.summary,
    keywords         = EXCLUDED.keywords,
    thumbnail_url    = EXCLUDED.thumbnail_url,
    route            = EXCLUDED.route,
    search_vector    = EXCLUDED.search_vector,
    entity_weight    = EXCLUDED.entity_weight,
    is_published     = EXCLUDED.is_published,
    source_updated_at = EXCLUDED.source_updated_at,
    indexed_at       = NOW();
END;
$$;
```

### 9.3 rpc_reindex_city

Rebuilds the entire `search_index` for a city. Run by City Admins from the admin UI or by the CEO for cross-city rebuilds. Not available to `anon`.

```sql
CREATE OR REPLACE FUNCTION rpc_reindex_city(p_city_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_row   record;
BEGIN
  -- Stories
  FOR v_row IN SELECT id FROM civic_stories   WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('story',       v_row.id); v_count := v_count + 1;
  END LOOP;
  -- Objects
  FOR v_row IN SELECT id FROM civic_entities  WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('object',      v_row.id); v_count := v_count + 1;
  END LOOP;
  FOR v_row IN SELECT id FROM civic_events    WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('object',      v_row.id); v_count := v_count + 1;
  END LOOP;
  FOR v_row IN SELECT id FROM civic_places    WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('object',      v_row.id); v_count := v_count + 1;
  END LOOP;
  FOR v_row IN SELECT id FROM civic_moments   WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('object',      v_row.id); v_count := v_count + 1;
  END LOOP;
  FOR v_row IN SELECT id FROM civic_artifacts WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('object',      v_row.id); v_count := v_count + 1;
  END LOOP;
  FOR v_row IN SELECT id FROM civic_neighborhoods WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('object',      v_row.id); v_count := v_count + 1;
  END LOOP;
  FOR v_row IN SELECT id FROM civic_eras      WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('object',      v_row.id); v_count := v_count + 1;
  END LOOP;
  -- Games
  FOR v_row IN SELECT id FROM games           WHERE city_id = p_city_id LOOP
    PERFORM rpc_reindex_entity('game',        v_row.id); v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('reindexed', v_count, 'city_id', p_city_id);
END;
$$;
```

---

## 10. RLS Policies

```sql
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- Public: published rows only
CREATE POLICY search_index_anon_read ON public.search_index
  FOR SELECT TO anon
  USING (is_published = true);

-- City Admin + CEO: all rows in their cities (including unpublished, for reindex audit)
CREATE POLICY search_index_admin ON public.search_index
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users WHERE auth_uid = auth.uid()::text
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('city_admin', 'ceo')
    AND city_id = ANY(
      SELECT unnest(city_ids) FROM admin_users WHERE auth_uid = auth.uid()::text
    )
  );

GRANT SELECT ON public.search_index TO anon;
```

**Access summary**

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| anon | Published rows only | ✗ | ✗ | ✗ |
| city_admin | All rows (own city) | ✗ | ✗ | ✗ |
| ceo | All rows (all cities) | ✗ | ✗ | ✗ |
| contributor | ✗ | ✗ | ✗ | ✗ |

No role may INSERT, UPDATE, or DELETE `search_index` rows directly. All writes are via `SECURITY DEFINER` RPCs (`rpc_reindex_entity`, `rpc_reindex_city`) only.

---

## 11. Audit Log Wiring

Admin-triggered search actions are written to `admin_action_logs` with `domain = 'search'`. Gameplay search actions (user queries) are not logged.

```
actor_user_id  →  auth.users.id of the acting admin
domain         →  'search'
entity_type    →  'search_index'
entity_id      →  search_index.entity_id (where applicable)
```

| action | Trigger | Key metadata fields |
|---|---|---|
| `search_index_entity_reindexed` | City Admin or CEO triggers manual reindex for one entity | `entity_type`, `entity_id`, `triggered_by` |
| `search_index_rebuilt` | City Admin or CEO triggers `rpc_reindex_city` | `city_id`, `reindexed_count`, `duration_ms` |
| `search_config_updated` | City Admin updates ranking weights or stop words in `city_prompts` | `changed_fields: { field: { old, new } }` |

User search queries (`rpc_search` calls by `anon`) are **not** logged. Electrum does not collect user search history. No analytics event is emitted for search queries beyond the client-side page view event already established on the results page.

---

## 12. DATA_MODEL.md Integration Checklist

The following diffs to `DATA_MODEL.md` are required when this spec is implemented. Generate them as a separate diff pass.

- [ ] **§2 Table Overview** — add `Search Tables` group with `search_index`
- [ ] **§3 Schema Blocks** — add full `Table: search_index` block (columns, field population rules, indexing rules, RLS note, trigger note)
- [ ] **§5 Naming Conventions** — add `search_` prefix entry; note that `search_index` is the only search table
- [ ] **§6 Foreign Key Map** — add §6.x Search Domain (city_id → cities.id; entity_id polymorphic note)
- [ ] **§7.1 anon role** — add `search_index (WHERE is_published = true)` to anon CAN SELECT list
- [ ] **§8.1 Public Queries** — add Search query pattern
- [ ] **§9 Extensions required** — add `pg_trgm` to required PostgreSQL extensions
- [ ] **§13.5 Workspace MUST NOT** — add: "Query `search_index` directly from public loaders; use `rpc_search`"
- [ ] **§14.3 Canonical action strings** — add `search` domain row

---

## 13. Future Expansion

### 13.1 Autocomplete

When autocomplete ships, the following additions are required:
- `rpc_autocomplete(p_query text, p_city_id uuid, p_limit int DEFAULT 5)` — queries `title` using `gin_trgm_ops` prefix matching; returns an array of `{title, entity_type, route}` objects in < 50 ms.
- The search bar component gains a `combobox` ARIA pattern with a `listbox` dropdown.
- Autocomplete results must respect the same sponsorship exclusion rules as `rpc_search` (§7).
- No schema change required; the `idx_search_index_title_trgm` index (§3.6) already supports it.

### 13.2 Semantic Search

When semantic search ships:
- A `search_embedding` column (`vector(1536)`) is added to `search_index` to store OpenAI or equivalent embeddings of `title + summary`.
- `pgvector` extension is required.
- `rpc_search_semantic(p_query text, p_city_id uuid)` computes a query embedding and uses cosine similarity (`<=>` operator) for ranking.
- Semantic results are merged with keyword results and re-ranked by a hybrid score.
- No changes to the existing `search_vector` column or `rpc_search` signature.

### 13.3 AI-Assisted Search

A future `rpc_search_ai(p_query text, p_city_id uuid)` accepts natural-language queries, extracts search intent via an LLM, and maps intent to entity types and keyword tokens before calling `rpc_search`. The AI layer is a pre-processing step; the retrieval mechanism remains `search_index`. No new table is required.

### 13.4 Multi-City Search

When global/multi-city search ships:
- `rpc_search` gains an optional `p_city_ids uuid[] DEFAULT NULL` parameter. `NULL` = search all cities.
- The `city_weight` ranking component (§5.5) activates: results from the user's current city receive a bonus; cross-city results receive a penalty.
- The `SearchResult` shape gains a `city_name` field to disambiguate results from multiple cities.
- The `/search` route becomes accessible at the root level (`/search?q=...`) in addition to `/search`.

### 13.5 Cursor-Based Pagination

Offset-based pagination (v1) degrades for large result sets. When cursor-based pagination ships:
- `rpc_search` gains `p_cursor text DEFAULT NULL` replacing `p_offset`.
- The cursor encodes `(relevance_score, entity_id)` for stable pagination.
- `SearchResponse` gains `next_cursor: string | null` replacing `next_offset`.
- No schema change to `search_index` required.

### 13.6 Sponsor Search Surface

If a sponsor discovery surface is ever built, the following constraints are **non-negotiable**:
- It must use a separate RPC (`rpc_search_sponsors`) and a separate index table (`sponsor_search_index`).
- It must never share code paths with `rpc_search`.
- Results must be displayed in a distinctly labelled UI surface that is not adjacent to civic search results.
- The `search_index` table must never gain a sponsorship-related column.
- This spec must be revised before any sponsor search work begins.
