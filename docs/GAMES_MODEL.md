# **GAMES_MODEL.md**
*Compatibility: DATA_MODEL.md · ARCHITECTURE.md · GAMES_WORKFLOW.md · GAMES_ADMIN_DASHBOARD_MODEL.md · SEARCH_MODEL.md*
*Audience: Backend contributors, Workspace, UI engineers*
*Last updated: 2026-10-13*

---

## 1. Purpose & Scope

### 1.1 What the Games System Is

The Electrum Games System is a city-scoped, non-monetized engagement layer that lets users explore civic memory through puzzles and challenges (e.g., word scramble, word search). It is:

- **Editorial-only** — no sponsorship influence, no ads, no paid rewards  
- **City-scoped** — scores and leaderboards are per city  
- **Identity-aware** — supports authenticated users and guest players  
- **Search-compatible** — games appear in search results as civic content  

This document defines the **data model** for games, players, scores, and leaderboards.

---

## 2. Core Tables

### 2.1 `games`

**Purpose:** Defines each game type and its configuration.

**Key fields:**

- `id uuid PK`  
- `city_id uuid FK → cities.id` (nullable for global games)  
- `slug text UNIQUE`  
- `title text`  
- `description text`  
- `game_type text` (`'word_scramble'`, `'word_search'`, etc.)  
- `game_data jsonb` — public puzzle/question payload
- `is_active boolean`  
- `difficulty text` (`'easy' | 'medium' | 'hard'`)  
- `max_score integer`  
- `created_at timestamptz`  
- `updated_at timestamptz`

Games are referenced by the UI components (`GameLauncher`, `WordScrambleGame`, `WordSearchGame`) and by admin dashboards. Games are city-scoped. Each game row belongs to exactly one city via city_id. Search and leaderboards only surface games where is_active = true.
Badges, scores, and game progress are city‑scoped. Each player has one game_user identity per city. A player who plays in multiple cities will have separate game_user rows, separate scores, and separate badge progress for each city.

The public UI reads question content from `game_data`. A multiple-choice question
uses `{ prompt, options, answer, explanation? }`; word-puzzle content may use the
existing `{ clue, scrambled, answer }` shape. Public gameplay is client-local and
does not read or write attempts or scores.

---

### 2.2 `game_users`

**Purpose:** Unified player identity for the Games System. 

**Key fields:**

- `id uuid PK`  
- `user_id uuid FK → auth.users(id)` (authenticated players)  
- `session_token text` (guest players)  
- `display_name text`  
- `avatar_url text`  
- `city_id uuid FK → cities.id`  
- `total_score integer NOT NULL DEFAULT 0`  
- `games_played integer NOT NULL DEFAULT 0`  
- `created_at timestamptz DEFAULT now()`  
- `updated_at timestamptz DEFAULT now()`  

**Identity constraint:**

- Authenticated: `user_id IS NOT NULL AND session_token IS NULL`  
- Guest: `user_id IS NULL AND session_token IS NOT NULL`  

**Uniqueness:**

- `UNIQUE (user_id)` — one game_user per auth user.

---

### 2.3 `game_scores` (optional, if you track per-session scores)

**Purpose:** Stores individual game sessions for analytics and badges.

**Key fields:**

- `id uuid PK`  
- `game_id uuid FK → games.id`  
- `game_user_id uuid FK → game_users.id`  
- `score integer`  
- `completed boolean`  
- `played_at timestamptz`  

This table is used by leaderboards, badges, and admin analytics.

---

### 2.4 `game_badges`

**Purpose:** Defines badge types and thresholds.

**Key fields:**

- `id uuid PK`  
- `slug text UNIQUE`  
- `title text`  
- `description text`  
- `icon_url text`  
- `threshold_score integer`  
- `threshold_games_played integer`  
- `created_at timestamptz`  

---

### 2.5 `game_user_badges`

**Purpose:** Links players to badges they’ve earned.

**Key fields:**

- `id uuid PK`  
- `game_user_id uuid FK → game_users.id`  
- `badge_id uuid FK → game_badges.id`  
- `awarded_at timestamptz`  

---

## 3. RLS Model

### 3.1 `game_users`

- **anon:** can see/modify only their own guest row (`session_token`)  
- **authenticated:** can see/modify only their own row (`user_id = auth.uid()`)  
- **service_role:** full access (leaderboards, admin dashboards)

### 3.2 `game_scores`, `game_user_badges`

- **anon/authenticated:** can see their own records only  
- **service_role:** full access

Leaderboards and admin dashboards use `service_role` via RPCs.

---

## 4. RPCs

### 4.1 `rpc_game_add_score(p_game_user_id uuid, p_points integer)`

- Increments `total_score` for a player.  
- Used by game components on completion.

### 4.2 `rpc_game_increment_attempt(p_game_user_id uuid)`

- Increments `games_played`.  
- Used when a game session starts or ends.

### 4.3 `rpc_game_leaderboard(p_city_id uuid, p_limit int DEFAULT 20)`

- Returns top players for a city.  
- Used by `Leaderboard` and admin dashboards.

---

## 5. Search Integration

Games appear in `search_index` as `entity_type = 'game'` with:

- `title`  
- `summary`  
- `route` (`/games` or `/games/[slug]`)  

Search never exposes scores or badges; it only surfaces games as civic experiences.
