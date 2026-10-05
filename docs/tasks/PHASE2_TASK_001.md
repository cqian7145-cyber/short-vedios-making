# Phase 2 Task V2-01 — Recraft Visual Identity

## Goal

Establish the Tech Blue Editorial visual language, secure local Recraft configuration
handling, and prepare a measured process for selecting and locking a reusable custom
style without changing Phase 1 generation/research/factory behavior.

## Requirements

- Recraft is the only external visual generation provider; Remotion remains compositor.
- Preserve Phase 1 dark academic background, ivory typography, and restrained gold.
- Keep keys and style ID out of tracked files, logs, and status output.
- Keep Recraft style unlocked until genuine cross-object output review passes.
- Add offline tests and Phase 2 documentation; do not implement V2-02 asset generation.

## Implementation

- Added strict non-secret profile at `src/visual/recraftStyleProfile.ts`.
- Added `src/recraft/config.ts` and two status commands. Missing style ID is valid while
  the profile is unlocked; callers can require it explicitly for a locked workflow.
- Added `prompts/recraft-style-v1.md`, the Phase 2 Style Bible, candidate rubric, and
  setup documentation.
- Kept the DeepSeek/Tavily/research/factory implementations untouched.

## Acceptance criteria

- [x] Exact empty-placeholder `.env.example` and `.env` ignore rules.
- [x] Phase 2 profile has no API key or style ID.
- [x] Preflight/status disclose only configured/missing and locked/unlocked.
- [x] Candidate directions and a >=80 provisional direction score are documented.
- [ ] Recraft-generated cross-object consistency evaluation reaches >=80.
- [ ] Real Recraft style ID is locked locally after that evaluation.
- [x] Offline tests cover configuration and profile validation.
- [x] Existing regression commands pass.

## Evidence

Commands run:

- `npm run typecheck` — passed.
- `npm test` — passed, 55 tests.
- `npm run validate:episodes` — passed for the tracked examples and existing local
  `episodes/test-variant.json`.
- `npm run phase2:preflight` — DeepSeek/Tavily configured; Recraft missing; style not
  locked. Output contained status only.
- `npm run recraft:style-status` — profile `Tech Blue Editorial`, version `recraft-v1`,
  API missing, style unlocked.
- `git diff --check` — passed (Git reported only expected line-ending normalization
  warnings for existing Windows working tree settings).

The five files under `assets/style/recraft-v1/` are original local SVG reference
studies, not Recraft outputs. Candidate C has a provisional written-direction score of
89/100; actual Recraft cross-object evaluation and real Style ID lock remain pending
because the local Recraft API key is missing. No Recraft API request was made.
