# Phase 2 Task V2-07 — Hybrid Factory V2

## Goal

Orchestrate Phase 1 Factory and Phase 2 AssetPlan, generation, library reuse,
Hybrid Composer, visual QA, human review, safe release render, and delivery with
durable state and bounded provider costs.

## Requirements

- `factory:v2` supports draft/release, resume, and existing-artifact integration.
- `factory:v2:review` supports approval and request-changes.
- Draft may show pending assets but visibly identifies its status; rejected assets
  remain excluded.
- Approval applies only to pending assets visible in the draft and records the QA
  warning codes reviewed by the user.
- Release requires verified research, valid inputs, human approval, safe assets,
  fresh QA, and explicit QA-failure override plus a reason when used.
- Provider use, cache/library reuse, fallback, checkpoint, and outputs are recorded
  without secrets.
- The Paradox offline smoke consumes saved artifacts without Research or Recraft.

## Implementation

- Reuses Phase1 `runFactory`, Task003 `generateAssets`, Task004 `render-hybrid.ts`,
  and Task006 `visual-qa.ts`.
- State, report, release-gate, and review logic live in `src/factory-v2/`.
- Local state/report and lock are under `runs/<id>/`; review under
  `generated/<id>/factory-v2-review.json`; delivery is under `deliveries/<id>/`.
- `--existing-artifacts` provides provider-free integration.
- At most three new Recraft assets are allowed per invocation by default; Task003
  continues to enforce the AssetPlan hard limit.

## Acceptance Criteria

- [x] Factory V2 and review CLI.
- [x] 14-stage state model, atomic state writes, lock, and checkpoints.
- [x] Draft bundle, visible-pending approval scope, rejected-asset protection.
- [x] Release gate, QA-warning acknowledgement, safe rerender and release QA.
- [x] Library/cache resolution and pre-provider generation cap.
- [x] Paradox offline hybrid draft render, QA, review bundle, human-review pause.
- [x] Fixture approval → safe release render → fresh release QA → delivery.
- [x] Offline tests cover state, lock, review scope, release gates, and secret-safe
  serialization.
- [x] Full repository tests, typecheck, Episode validation, library doctor, and
  Phase 1 Factory CLI regression.
- [x] Provider preflight and bounded live smoke; it stopped at human review.
- [x] Final diff/security review, commit, and push.

## Evidence

- Command: `npm run factory:v2 -- --id paradox-of-choice --existing-artifacts --draft`.
- Render: 60.0667-second, 1920x1080, 30 fps hybrid draft at
  `output/paradox-of-choice-hybrid-draft.mp4`.
- Assets: pending door included in draft; rejected person excluded through
  procedural AgentToken fallback; 7 total fallbacks.
- QA: 100/100, `WARNING`, release action `human-review-required`.
- Result: `AWAITING HUMAN REVIEW`; door remained pending and person remained
  rejected. No DeepSeek, Tavily, or Recraft call occurred in this smoke.

- Live command: `npm run factory:v2 -- --topic "Why can making something more
  efficient increase total consumption?" --id jevons-paradox-v2-smoke --duration 60
  --draft --max-recraft-assets 3`.
- Live result after resume: 5 DeepSeek calls, 7 Tavily queries, 0 Recraft calls,
  0 cache/library hits, 0 fallbacks; 58.93-second draft, QA 94/100 WARNING, and
  `AWAITING HUMAN REVIEW`. The saved Fact Pack has 18 sources but
  `publicationReady=false`, so release remains correctly blocked.
- Fixture release: copied Paradox inputs to isolated ignored local artifacts,
  approved only the draft-visible pending door, retained the rejected person
  fallback, rendered the safe final MP4, reran QA (100/100 WARNING with reviewed
  matte warning), and completed the delivery package with hashes for inputs, QA, and final MP4. Original Paradox review state
  was not changed.
- Regression commands passed: `npm test` (222 tests),
  `npm run typecheck`, `npm run validate:episodes`, `npm run library:doctor`,
  `npm run phase2:preflight`, and `npm run factory -- --help`.
