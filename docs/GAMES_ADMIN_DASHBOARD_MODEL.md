# **GAMES_ADMIN_DASHBOARD_MODEL.md**
*Compatibility: GAMES_MODEL.md · GAMES_WORKFLOW.md · ARCHITECTURE.md · CONTRIBUTING.md*
*Audience: Admin UI engineers, backend engineers, Workspace, governance contributors*
*Last updated: 2026-10-13*

---

## 1. Purpose

The Games Admin Dashboard is the **governance surface** for the Electrum Games System. It allows trusted administrators to:

- configure games  
- monitor player activity  
- manage leaderboards  
- moderate abusive behavior  
- adjust difficulty and thresholds  

It is **not** a player-facing surface and is always protected by admin-only access.

NOTE: In the prototype, Administration tools are deferred. The playable prototype includes no admin screens, no score resets, no moderation, and no badge configuration UI.

---

## 2. Route & Access

- Route: `/admin/games`  
- Access: `service_role` + admin RBAC (outside this spec)  
- RLS: all data access via admin RPCs, not direct table queries.

---

## 3. Dashboard Sections

### 3.1 Games Configuration

Shows a table of `games`:

- columns:
  - title  
  - slug  
  - city  
  - game_type  
  - difficulty  
  - is_active  
  - max_score  

Admin actions:

- create new game  
- edit title/description/difficulty  
- activate/deactivate game  
- change max_score  

All changes go through a `rpc_admin_update_game` RPC with validation.

---

### 3.2 Leaderboards

Shows city-scoped leaderboards using `rpc_game_leaderboard`:

- select city  
- view top N players  
- columns:
  - display_name  
  - total_score  
  - games_played  
  - badges earned  

Admin actions:

- view player detail (opens Player Detail panel)  
- export leaderboard (CSV or JSON)  

---

### 3.3 Player Detail

For a selected `game_user`:

- show:
  - display_name  
  - avatar_url  
  - city  
  - total_score  
  - games_played  
  - badges (from `game_user_badges`)  
  - recent game sessions (from `game_scores`)  

Admin actions:

- reset scores (with confirmation + audit log)  
- deactivate player (soft block from games)  

All actions go through `rpc_admin_reset_scores` / `rpc_admin_deactivate_player`.

---

### 3.4 Badges Management

Shows `game_badges`:

- columns:
  - title  
  - slug  
  - threshold_score  
  - threshold_games_played  

Admin actions:

- create new badge  
- edit thresholds  
- deactivate badge  

Changes go through `rpc_admin_update_badge`.

---

## 4. Audit & Logging

All admin actions must:

- be logged with:
  - admin user id  
  - timestamp  
  - action type  
  - target (game, player, badge)  

- be reversible where possible (e.g., score reset with restore option).

Audit logging is implemented via a dedicated `admin_logs` table or equivalent.

---

## 5. Sponsorship Independence

The Games Admin Dashboard:

- never displays sponsor content  
- never exposes sponsor data  
- never allows sponsors to influence game configuration, scoring, or leaderboards  

Games governance is editorial and civic, not commercial.

---

## 6. ADA & UX Requirements

- Dashboard must be keyboard-navigable.  
- Tables must have proper headers and labels.  
- Forms must have clear error messages.  
- Color usage must respect Electrum’s contrast rules.  

Admin surfaces are held to the same accessibility standards as public UI.

