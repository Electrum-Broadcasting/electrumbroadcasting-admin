# GAME_USER_CREATION_FLOW.md
Electrum — Game User Creation & Identity Flow  
Compatibility: GAMES_MODEL.md · GAMES_WORKFLOW.md · DATA_MODEL.md · ARCHITECTURE.md  
Audience: Backend contributors, Workspace, UI engineers  
Last updated: 2026‑10‑13

## 1. Purpose
This document defines how Electrum creates and manages Game User identities for the Games System. Game Users represent players in:

Word Scramble

Word Search

future civic games

The system supports:

authenticated players

guest players

fraud‑resistant identity enforcement

city‑scoped leaderboards

Administrators do not manage Game Users manually.
Identity creation is fully automated.

## 2. Identity Model
Electrum uses a dual identity model:

### 2.1 Authenticated Players
Identified by auth.users.id

Stored in game_users.user_id

Guaranteed unique by UNIQUE (user_id)

Persist across sessions

Persist across devices

Can earn badges

Appear in leaderboards

Authenticated players have one game_user identity per city. Launching a game in a new city creates a new city-scoped game_user row.

### 2.2 Guest Players
Identified by session_token

Stored in game_users.session_token

Unique per browser session

Persist until session expires

Can earn badges

Appear in leaderboards

Guest identities are also city-scoped. A guest playing in multiple cities receives separate temporary identities per city.

### 2.3 Identity Constraint
Enforced by:

sql
CHECK (
  (user_id IS NOT NULL AND session_token IS NULL) OR
  (user_id IS NULL AND session_token IS NOT NULL)
)
This ensures:

no mixed identities

no duplicate identities

no spoofed identities

## 3. Creation Flow
### 3.1 Authenticated Player Creation
Triggered when:

a signed‑in user launches a game

or opens /games

or opens /dashboard

or completes a game session

Flow:

UI calls rpc_get_or_create_game_user().

RPC checks for existing row:

sql
SELECT id FROM game_users WHERE user_id = auth.uid();
If found → return existing game_user.id.

If not found → insert new row:

sql
INSERT INTO game_users (user_id, city_id)
VALUES (auth.uid(), p_city_id)
RETURNING id;
Return game_user.id to UI.

### 3.2 Guest Player Creation
Triggered when:

an anonymous user launches a game

or opens /games

or completes a game session

Flow:

UI generates a session_token (UUID).

UI calls rpc_get_or_create_guest_game_user(session_token).

RPC checks for existing row:

sql
SELECT id FROM game_users WHERE session_token = p_session_token;
If found → return existing game_user.id.

If not found → insert new row:

sql
INSERT INTO game_users (session_token, city_id)
VALUES (p_session_token, p_city_id)
RETURNING id;
Return game_user.id to UI.

## 4. Fraud Prevention
Electrum’s identity model prevents:

### 4.1 Duplicate Accounts
UNIQUE (user_id)

prevents multiple identities per auth user

### 4.2 Guest Replay Fraud
session_token is unique per session

cannot be reused across devices

cannot be spoofed

### 4.3 Score Forging
scores can only be updated via RPCs

RPCs are SECURITY DEFINER

direct writes to game_users are blocked by RLS

### 4.4 Leaderboard Manipulation
leaderboards use service_role

players cannot influence ranking logic

### 4.5 City Spoofing
city_id is stored in game_users

leaderboards filter by city

players cannot appear in multiple cities

### 4.6 Identity Hijacking
RLS prevents cross‑identity access

guests can only update their own row

auth users can only update their own row

## 5. UI Integration
### 5.1 GameLauncher
requests game_user.id before launching a game

passes game_user.id to game components

### 5.2 WordScrambleGame / WordSearchGame
call scoring RPCs using game_user.id

### 5.3 Leaderboard
uses city_id from game_users

### 5.4 MyScoresPanel
reads badges and scores for the current game_user.id

## 6. Admin Independence
Administrators do not:

create Game Users

delete Game Users

merge Game Users

manage identities

Administrators only:

configure games

configure badges

view analytics

moderate abusive players (rare)

Identity creation is fully automated.

## 7. Summary
Electrum’s Game User creation flow is:

automatic

fraud‑resistant

city‑scoped

RLS‑safe

RPC‑controlled

guest‑friendly

admin‑independent

This ensures a clean, scalable, and secure Games System.