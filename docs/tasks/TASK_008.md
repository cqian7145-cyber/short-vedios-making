# TASK 008 — One-command verified video factory

## Goal

Connect the source-backed Task007 pipeline to a resumable one-command path that validates, quality-gates, renders, and packages an English visual knowledge episode. Valid Task007 research artifacts must flow into the factory without repeating research.

## Requirements

- One command: `npm run factory -- --topic "..." --id <id> [--duration 150]`.
- Ten logged stages: preflight, brief, research plan, research, Fact Pack, verified Episode, VisualPlan, quality gates, Remotion render, delivery package.
- Local schema validation and resumable checkpoints; topic mismatch must not silently reuse research.
- Reuse valid Task007 Fact Pack, Episode, VisualPlan, and brief artifacts.
- Bounded visual QA repair (maximum one); release gates for production duration; explicit draft marking when bypassing gates.
- Deterministic offline Remotion render; representative still frames; YouTube metadata, chapters, source list, claim trace, review checklist, and report.
- No TTS, voice-over, music, audio processing, image generation, upload, or API calls during render.
- Credentials loaded locally and redacted from logs; generated/run artifacts ignored.

## Implementation

- Added `src/factory/` orchestration, config, checkpoint store, reports, render strategy, quality gates, and delivery generation.
- Added CLI at `scripts/factory.ts` and `npm run factory`; dotenv loads local `.env` without tracking it.
- Added optional per-scene verified `claimIds` for a traceable scene → claim → source handoff while keeping old Episodes valid.
- Refactored research helpers so factory stages can persist and resume plan/source/Fact Pack artifacts.
- Extended the VisualPlan with a semantic layout choice and route plan archetypes to existing renderer capabilities with documented fallbacks.
- Added Remotion still-frame rendering using the same Episode/VisualPlan props as video rendering.
- Added Task008 mock integration coverage proving existing Task007 Fact Pack, brief, Episode, and VisualPlan are reused without LLM or research provider calls.

## Acceptance Criteria

- [x] Single-command factory CLI and help output.
- [x] Valid Task007 research checkpoint skips query planning, Tavily, and Fact Pack regeneration.
- [x] Episode and VisualPlan checkpoints validate against local schemas and are reused when matching.
- [x] Bounded visual QA repair and production release gates.
- [x] Render uses local Episode/VisualPlan and Remotion; no generation/research provider is required for render-only reuse.
- [x] Delivery includes deterministic representative stills, metadata, chapters, sources, claim trace, review checklist, and report.
- [x] No API key is logged or committed; no audio or upload stage.
- [x] `npm run typecheck`, `npm test`, and `npm run validate:episodes` pass.
- [x] Real Task007 artifacts complete an offline factory run and produce an MP4 and QA frames.
- [ ] Git commit and push complete.

## Evidence

Commands executed:

- `npm run typecheck` — passed (`tsc --noEmit`).
- `npm test` — passed, 50 tests / 50 passed, including Task008 CLI, collision protection, and Task007 artifact reuse integration tests.
- `npm run validate:episodes` — passed for `braess-paradox.json`, `dollar-auction.json`, and the existing `test-variant.json`.
- `npm run factory -- --help` — passed; prints the documented options.
- `npm run factory -- --topic "Why can more choices make decisions worse?" --id paradox-of-choice --resume` — passed. Research Plan and Research were skipped; ContentBrief, Fact Pack, Episode, and VisualPlan were reused. Reported LLM calls: 0; planned queries: 8; executed research queries: 0; Fact Pack publication readiness: true; visual diversity score: 80/100; unique archetypes: 6; visual QA repair attempts: 0.
- Remotion produced `output/paradox-of-choice.mp4`. `ffprobe` verified 1920×1080, 30/1 FPS, 60.066667 seconds, 7,966,791 bytes. Eleven deterministic representative still frames were rendered under `qa/paradox-of-choice/`; a frame was visually inspected.
- DeepSeek and Tavily keys were absent from the current environment; no fresh API calls were made. This run demonstrates offline reuse/render, not a fresh-generation API smoke.

Important files: `src/factory/factory.ts`, `src/factory/renderStrategy.ts`, `scripts/factory.ts`, `src/engine/VisualStrategyOverlay.tsx`, `docs/FACTORY.md`, and `tests/task008.test.ts`.
