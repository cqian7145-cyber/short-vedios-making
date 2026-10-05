# Phase 2 Task V2-01 — Locked Recraft Style Validation

> Status history: the initial selected public style was rejected at 41/100. This
> continuation replaces that candidate with the original custom profile `Midnight
> Scientific Editorial v1`; it does not begin Task002.

## Goal

Validate the user-selected Recraft style across a controlled smoke and six asset
categories, record evidence without leaking credentials/style ID, and preserve the
Phase 1 Remotion visual system and Factory v1.

## Implementation

- Added the non-secret `recraft-v1` profile and required-key/style config resolver.
- Added an HTTP Recraft provider using the official image-generation endpoint, a fixed
  style-driven model, request/response schemas, and redacted provider errors.
- Added a semantic asset contract, future-safe manifest schema, validation runner,
  report schema, and human review sheet.
- Recraft asset images are ignored by Git; manifest and report omit secret values.
- Recraft remains optional to Phase 1 / Factory v1.

## Acceptance criteria

- [x] Selected style ID is read only from `process.env.RECRAFT_STYLE_ID`.
- [x] No key or style ID is hard-coded, logged, or stored in tracked metadata.
- [x] API endpoint/model/format/response documented from official references.
- [x] Semantic request maps to the provider request through the Recraft provider.
- [x] Offline tests use injected mock fetch only.
- [x] Real one-image smoke succeeds.
- [x] All six validation assets are generated and visually assessed.
- [x] Editorial score recorded; result is rejected at 41/100 and style remains unlocked.
- [ ] Final human approval recorded.
- [x] Phase 1 tests, episode validation, and Factory v1 regression pass.

## Evidence

Commands and outcomes:

- `npm run phase2:preflight` — DeepSeek, Tavily, Recraft API, and Recraft Style report
  configured; no values printed.
- `npm run recraft:style-status` — selected profile, API configured, Style locked; no
  identifier printed.
- `npm run recraft:validate-style` — smoke passed and generated six validation PNGs.
- `npm run recraft:score-style` — rejected; editorial heuristic 41/100; human approval
  pending; `styleLocked=false`.
- `npm run typecheck` — passed.
- `npm test` — passed, 61 tests.
- `npm run validate:episodes` — passed.
- Factory v1 regression — existing Task008 test reused Task007 artifacts without
  provider calls; Recraft is not a Factory v1 dependency.

Images are ignored by Git; the manifest and score/report contain no API key or Style
ID. The original A/B/C studies from the prior exploratory task were removed so the
selected style is the sole Phase 2 v1 profile.

## Task001 continuation — Midnight Scientific Editorial v1

- Six original reference subjects are authored as local SVG assets under
  `assets/style-validation/midnight-scientific-editorial-v1/references/`.
- `npm run recraft:validate-midnight-style` rasterizes them with installed Chrome,
  creates a Recraft custom style using the documented V3 style endpoint if no Style
  ID is configured, and generates six atomic tests. A just-created ID remains only
  in process memory because `.env` must not be modified during this task.
- Scoring adds semantic accuracy and blocks locking on any critical semantic failure.
  `npm run recraft:score-midnight-style` requires an assessment and exactly six outputs.
- Human approval remains required even if the score reaches 80.

### Continuation evidence

Completed technical evidence (2026-10-05):

- Reference set: six original 1024×1024 SVG sources, rasterized to PNG for the API.
- New custom Style creation: real API creation succeeded; returned identifier was used
  in memory only and was not persisted or displayed.
- Six-image validation: 6/6 generated successfully.
- Semantic score / critical failures: 12/20; two critical failures (auction paddle,
  branching-choice icon).
- Overall score: 63/100, rejected; styleLocked=false.
- Human review status: pending; approval required.
- `npm test` — passed, 63 tests, including mocked style-creation/provider tests and
  Task008 reuse of existing Task007 artifacts without provider calls.
- `npm run typecheck` — passed.
- `npm run validate:episodes` — passed for Braess Paradox, Dollar Auction, and the
  existing untracked `test-variant.json`.
- Phase1 Factory regression — covered by the passing Task008 reuse test; no live
  research or provider call was made.
