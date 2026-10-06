# Phase 2 Task V2-05 — Asset Library + Smart Reuse

## Goal

Accumulate explicitly approved visual assets locally and prefer safe deterministic reuse across Episodes before requesting new generation.

## Requirements

- [x] Keep Recraft-generated-approved and human-curated provenance distinct.
- [x] Refuse pending, rejected, unreviewed, missing, or invalid assets during promotion.
- [x] Store verified PNG/SVG content by SHA-256 and preserve source references on dedupe.
- [x] Add canonical names, reuse keys, aliases, tags, strict kind/profile/role/background checks, and candidate-only low scores.
- [x] Track actual episode/scene usage; allow same-Episode motifs; warn for frequent cross-Episode reuse.
- [x] Add search/list/promote/curated-intake/disable/doctor CLI commands.
- [x] Integrate Task002 lookup, Task003 zero-call resolution, and Task004 approved/hash-checked staging.
- [x] Keep every Task005 operation offline; no Recraft, DeepSeek, or Tavily calls.

## Implementation

The strict schema, local index, promotion, validator, resolver, scorer, use tracking, and health check live in `src/assets/library/`. `scripts/library-*.ts` provide the CLI. Task002 writes `libraryAssetId`; Task003 resolves only approved compatible PNGs without calling Recraft; Task004 rechecks index approval, enabled state, file path, PNG validity, and indexed SHA-256 before staging. Curated SVG/PNG intake requires explicit license status. The short-render smoke also exposed and fixed a duplicate CinematicBackground interpolation range.

## Acceptance Criteria

All required Task V2-05 behavior is implemented and has offline coverage. Current real Episode state is unchanged: door remains pending, person remains rejected. The current project library is empty until a person promotes approved assets.

## Evidence

- `npm test` — PASS, 160 tests, 0 failures.
- `npm run typecheck` — PASS.
- `npm run validate:episodes` — PASS: braess-paradox (1800 frames), dollar-auction (1422 frames), and test-variant (1482 frames).
- `npm run plan:assets -- --episode <temporary Task005 copy> --visual-plan generated/paradox-of-choice/visual-plan.json --facts research/paradox-of-choice/fact-pack.json --dry-run` — PASS, heuristic/offline, 8 scenes, 0 new Recraft assets.
- `npm run generate:assets -- --plan generated/paradox-of-choice/asset-plan.json --dry-run` — PASS, 2 cached, 0 to generate, 0 Recraft calls.
- `npm run render:hybrid` with a temporary 2-second procedural fixture — PASS, 1920×1080, 30 FPS; output `output/task005-offline-render-smoke-retry.mp4`.
- `npm run library:promote -- --episode paradox-of-choice --asset choice-door-v1 ...` — correctly refused: `Cannot promote pending asset choice-door-v1.`
- Promotion of `choice-person-v1` — correctly refused because it is rejected.
- Fixture smoke: approved PNG promotion, same-byte dedupe into one library binary with two source references, deterministic reuse, Task003 `recraftCallCount=0`, Task004 staging, and disabled-asset exclusion all passed.
- `npm run library:doctor` — PASS; live library currently contains 0 generated and 0 curated assets. Fixture assets were created only in temporary test directories.
- Provider call test and Task008 factory regression passed within the offline automated suite. No paid API was used.
- `git diff --cached --check` — PASS; staged-file security scan found no API key value or selected Style UUID. `.env`, local Style state, user Episode files, and planning files were not staged.\n- Commit `4c7bd4c` (`feat: add reusable visual asset library`) — created on `main`.\n- `git push origin main` — PASS; `main` advanced from `3426bd3` to `4c7bd4c`.\n- `stash@{0}` remains present and untouched.
