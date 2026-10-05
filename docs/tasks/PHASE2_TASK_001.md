# Phase 2 Task V2-01 — Locked Recraft Style Validation

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
