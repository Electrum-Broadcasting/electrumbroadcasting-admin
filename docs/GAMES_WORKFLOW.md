# **GAMES_WORKFLOW.md**
*Compatibility: GAMES_MODEL.md · ARCHITECTURE.md · GAMES_ADMIN_DASHBOARD_MODEL.md · SEARCH_WORKFLOW.md*
*Audience: UI engineers, backend engineers, Workspace, QA*
*Last updated: 2026-10-13*

---

## 1. Purpose

This document describes the **end-to-end lifecycle** of a game session in Electrum:

- how a player is identified  
- how a game is launched  
- how scores are recorded  
- how badges are awarded  
- how leaderboards are populated  
- how city scoping and RLS are enforced  

---

## 2. Player Identity Workflow

### 2.1 Authenticated players

1. User signs in via Supabase auth.  
2. `game_users` row is created (if not present) with `user_id = auth.uid()`.  
3. All game activity is tied to this `game_user.id`.

### 2.2 Guest players

1. A `session_token` is generated client-side or via RPC.  
2. `game_users` row is created with `session_token` and optional `city_id`.  
3. All game activity is tied to this `game_user.id`.  
4. If the user later authenticates, a migration can link `user_id` to the existing row.

---

## 3. Game Launch Workflow

1. User navigates to `/games`.  
2. `GameLauncher` loads available games from `games`.  
3. User selects a game (e.g., Word Scramble, Word Search).  
4. The game component (`WordScrambleGame`, `WordSearchGame`) receives:
   - `game_id`  
   - `game_user_id`  
   - `city_id`  

5. The game starts and renders instructions.

---

## 4. Scoring Workflow

### 4.1 On game completion

When a game session ends:

1. The game component computes score and time_taken entirely client-side. No server-side validation or scoring occurs in the playable prototype. 
2. It calls `rpc_game_add_score(p_game_user_id, p_points)`.  
3. It optionally inserts a row into `game_scores` with:
   - `game_id`  
   - `game_user_id`  
   - `score`  
   - `completed = true`  
   - `played_at = now()`  
In the playable prototype, session history is stored in browser memory only. No rows are written to game_scores.
Rationale:
4. It calls `rpc_game_increment_attempt(p_game_user_id)` to increment `games_played`.

---

## 5. Badge Workflow

### 5.1 Badge evaluation

After score/attempt updates:

1. A badge evaluation function (RPC or trigger) checks:
   - `total_score`  
   - `games_played`  
   - per-game performance (from `game_scores`)  

2. If thresholds are met for a badge in `game_badges`, a row is inserted into `game_user_badges`.

### 5.2 Badge display

- `BadgeDisplay` reads `game_user_badges` for the current player.  
- Badges are shown in:
  - `UserDashboard`  
  - `MyScoresPanel`  
  - Game completion screens  

---

## 6. Leaderboard Workflow

### 6.1 City-scoped leaderboard

1. `Leaderboard` calls `rpc_game_leaderboard(p_city_id, p_limit)`.  
2. The RPC returns `game_users` rows ordered by:
   - `total_score DESC`  
   - `games_played DESC`  

3. The UI renders:
   - display_name  
   - avatar  
   - total_score  
   - games_played  
   - badges (optional)  

Leaderboards never show email addresses or internal IDs.

---

## 7. Admin Workflow (high-level)

Admin workflows are detailed in **GAMES_ADMIN_DASHBOARD_MODEL.md**, but at a high level:

- Admins can:
  - view city leaderboards  
  - inspect player histories  
  - reset scores (with audit trail)  
  - deactivate games  
  - adjust difficulty and configuration  

All admin actions use `service_role` RPCs and are logged.

---

## 8. Sponsorship & Ethics

Games:

- never display sponsor creative  
- never alter scoring based on sponsorship  
- never alter ranking based on sponsorship  
- never award monetary or extractive rewards  

Games are civic engagement tools, not advertising channels.

