# LEADERBOARD_RANKING_SPEC.md 
Electrum — Leaderboard Ranking Specification  
Compatibility: GAMES_MODEL.md · GAMES_WORKFLOW.md · GAME_USER_CREATION_FLOW.md · BADGE_LOGIC_SPEC.md  
Audience: Backend contributors, UI engineers, Workspace  
Last updated: 2026‑10‑13

## 1. Purpose
This spec defines how Electrum ranks players in city-scoped leaderboards.

Leaderboards appear on:

/games

admin dashboards

future civic engagement surfaces

## 2. Ranking Inputs
Leaderboards use:

total_score

games_played

city_id

Optional:

badges (display only)

Leaderboards do not use:

time_taken

game_type

game_data

performance metrics

sponsor metrics

## 3. Ranking Algorithm
### 3.1 Primary Sort
sql
ORDER BY total_score DESC
### 3.2 Secondary Sort
sql
ORDER BY games_played DESC
### 3.3 Tertiary Sort (optional)
sql
ORDER BY created_at ASC
This rewards long-term civic engagement.

NOTE: In the playable prototype, leaderboard entries are stored in browser memory and reset on reload. No server-side ranking or persistence occurs.

### 3.4 City Scoping
Leaderboards filter by:

sql
WHERE city_id = p_city_id
Players cannot appear in multiple cities.

## 4. RPC Definition
Leaderboards are generated via:

sql
rpc_game_leaderboard(p_city_id uuid, p_limit int DEFAULT 20)
This RPC:

uses service_role

bypasses RLS

returns ranked game_users rows

NOTE: In the playable prototype, leaderboards are computed client-side using temporary guest and sample player data. No RPCs or database queries are used.

## 5. Fraud Prevention
Leaderboards are protected by:

### 5.1 Identity Model
one identity per auth user

one identity per guest session

### 5.2 RLS
Players cannot modify other players’ scores.

### 5.3 RPC Enforcement
Scores can only be updated via server-side RPCs.

### 5.4 City Scoping
Players cannot spoof city_id.

### 5.5 Admin Independence
Admins cannot manually alter scores.

## 6. UI Integration
### 6.1 Leaderboard Component
Shows:

display_name

avatar_url

total_score

games_played

badges (optional)

### 6.2 Mobile Behavior
Single-column layout.

### 6.3 ADA
table headers

screen reader labels

keyboard navigation

## 7. Sponsorship Independence
Leaderboards:

never display sponsor creative

never alter ranking based on sponsorship

never include sponsor metadata

Leaderboards are civic-only.