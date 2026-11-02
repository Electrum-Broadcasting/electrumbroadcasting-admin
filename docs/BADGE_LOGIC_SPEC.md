# BADGE_LOGIC_SPEC.md 
Electrum — Civic Games Badge Logic Specification  
Compatibility: GAMES_MODEL.md · GAMES_WORKFLOW.md · GAME_USER_CREATION_FLOW.md · GAMES_ADMIN_DASHBOARD_MODEL.md  
Audience: Backend contributors, Workspace, UI engineers  
Last updated: 2026‑10‑13

## 1. Purpose
Badges are Electrum’s civic achievement system. They reward:

consistent play

high scores

city engagement

puzzle mastery

Badges are non-monetized, non-sponsor-influenced, and city-scoped.

This spec defines:

badge types

thresholds

awarding rules

evaluation workflow

UI integration

admin configuration

## 2. Badge Types
Electrum supports three badge categories:

### 2.1 Score-Based Badges
Awarded when total_score crosses thresholds.

Examples:

Bronze Solver — 100 points

Silver Solver — 250 points

Gold Solver — 500 points

Civic Master — 1000 points

### 2.2 Activity-Based Badges
Awarded when games_played crosses thresholds.

Examples:

First Steps — 1 game

Explorer — 10 games

Trailblazer — 25 games

Atlas Champion — 50 games

### 2.3 Performance-Based Badges
Awarded based on individual game session performance (from game_scores).

Examples:

Perfect Scramble — 100% score

Speed Runner — time_taken < threshold

Word Search Ace — completed without hints

Performance badges are optional and game-specific.

## 3. Badge Evaluation Workflow
Badge evaluation occurs after every game session.

### 3.1 Trigger
Evaluation is triggered by:

rpc_game_add_score

rpc_game_increment_attempt

INSERT INTO game_scores

### 3.2 Evaluation Steps
Fetch player’s game_user row.

Fetch player’s game_scores (recent session). In the playable prototype, badge evaluation uses browser-only session data. No game_scores rows exist.

Compare against badge thresholds in game_badges.

For each badge where thresholds are met:

Check if badge already awarded

If not, insert into game_user_badges

### 3.3 Awarding Rule
Badges are awarded once per player.

### 3.4 City Scoping
Badges are city-scoped. A player earns badges separately in each city. Temporary guest players earn badges only within the current city session.

## 4. Badge Storage
### 4.1 game_badges
Defines badge metadata:

slug

title

description

icon_url

threshold_score

threshold_games_played

optional performance thresholds

### 4.2 game_user_badges
Links players to badges:

game_user_id

badge_id

awarded_at

## 5. UI Integration
### 5.1 BadgeDisplay
Shows badges earned by the player.

### 5.2 MyScoresPanel
Shows progress toward next badge.

### 5.3 Leaderboard
May optionally show badge icons next to top players.

### 5.4 Game Completion Screen
Shows newly earned badges.

## 6. Admin Configuration
Admins can:

create badges

edit thresholds

deactivate badges

Admins cannot:

manually award badges

remove badges

override badge logic

All changes go through rpc_admin_update_badge.

## 7. Sponsorship Independence
Badges:

never display sponsor creative

never alter thresholds based on sponsorship

never award sponsor-related achievements

Badges are civic-only.