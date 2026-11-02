# GAME_SESSION_FLOW_SPEC.md  
Compatibility: GAMES_MODEL.md · GAMES_WORKFLOW.md · GAME_USER_CREATION_FLOW.md · BADGE_LOGIC_SPEC.md  
Audience: UI engineers, backend engineers, Workspace, QA  
Last updated: 2026‑10‑13

## 1. Purpose
This spec defines the complete lifecycle of a game session in Electrum:

launching a game

playing a game

completing a game

scoring

attempts

badge evaluation

leaderboard updates

It applies to:

Word Scramble

Word Search

future puzzle-based games

## 2. Session Lifecycle
### 2.1 Session Start
Triggered when:

user clicks “Play” on /games

user launches a game directly via route

Steps:

UI obtains game_user.id via identity flow.

UI loads game configuration from games.

UI initializes game state.

UI records session start time (client-side).

### 2.2 Gameplay
Game components:

WordScrambleGame

WordSearchGame

Handle:

puzzle generation

user input

scoring logic

time tracking

completion detection

### 2.3 Session Completion
Triggered when:

puzzle solved

user completes game

user exits early (optional)

Steps:

UI computes score.

UI computes time_taken.

UI calls:

sql
rpc_game_add_score(game_user_id, score)
rpc_game_increment_attempt(game_user_id)

NOTE: In the playable prototype, scoring and attempts are updated atomically in browser memory. No RPCs are called.

UI inserts into game_scores:

game_id

game_user_id

score

completed

time_taken

played_at

Badge evaluation runs.

UI shows completion screen.

NOTE: In the playable prototype, session history is stored in browser memory only. No database writes occur.

## 3. Error Handling
### 3.1 Network Errors
UI retries RPC calls.

### 3.2 Invalid Identity
UI regenerates session_token and retries.

### 3.3 Invalid Game
UI shows “Game unavailable” and returns to /games.

## 4. ADA Requirements
keyboard navigation

screen reader labels

high contrast

no timed gameplay penalties

## 5. Sponsorship Independence
Game sessions:

never display sponsor creative

never alter scoring based on sponsorship

never alter badge thresholds based on sponsorship

Games are editorial-only.