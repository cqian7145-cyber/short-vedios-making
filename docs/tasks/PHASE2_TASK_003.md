# Phase 2 Task V2-03 — Recraft Asset Generation Engine

## Goal

Execute AssetPlan's explicitly requested new Recraft assets with deterministic caching, safe reuse, bounded network retries, validated PNG output, durable partial progress, and human-review metadata.

## Requirements

- Planning remains in Task002; generation does not call research or language-model providers.
- Remotion remains responsible for precise knowledge graphics and final composition.
- Enforce AssetPlan's hard budget before any API request; require opt-in for high semantic risk.
- Never serialize API keys, Style IDs, or authorization headers.
- Keep dry-run offline and preserve successful files after partial failure.

## Implementation

- `src/assets/generation/` contains the executor, strict schemas, prompt builder, cache, registry lookup, and PNG validation.
- `scripts/generate-assets.ts` exposes `npm run generate:assets`.
- Per-episode output includes PNGs, manifest, and human-review preview. Ignored cache/state/report paths support reuse and resume.

## Acceptance Criteria

- Dry-run reports requests, cache hits, risk and budget with zero Recraft calls.
- Normal execution uses the existing RecraftProvider and only generates unique `source: new` plan assets.
- Cache keys are deterministic and exclude secrets and Style ID.
- Reuse misses fail visibly; high-risk assets skip by default; procedural-only concepts are rejected.
- Invalid PNGs are not published as ready; generated images remain `needs-human-review`.
- Partial results persist and `--retry-failed` only retries failed plan assets.
- Tests, typecheck, episode validation, Phase1 factory regression, first real smoke, and second-run cache smoke are recorded below.

## Evidence

- `npm run generate:assets -- --plan generated/paradox-of-choice/asset-plan.json --dry-run`: requested 2, cached 0, planned generation 2, high risk 0, budget 2/5, Recraft calls 0.
- `npm run generate:assets -- --plan generated/paradox-of-choice/asset-plan.json`: generated 2 PNGs, 0 cache/reuse hits, 0 failures, 2 Recraft calls.
- Second normal run: generated 0, cache hits 2, Recraft calls 0. Report remains `warning` because semantic correctness and embedded-text risk need human review.
- During initial live smoke, Recraft rejected the verbose prompt at the documented 1000-character limit. The prompt was shortened and local bounds added; the subsequent 2-asset generation succeeded.
- Visual inspection of `choice-person-v1.png` found unwanted numerals (1, 2, 4, 5). This is recorded in the local manifest/report and preview. Do not composite that asset until a human approves a replacement. Machine file validation does not claim semantic correctness.
- Validation commands: final `npm test` passed (115 tests); `npm run typecheck` passed; `npm run validate:episodes` passed for Braess Paradox, Dollar Auction, and the pre-existing test variant. The Task008 factory regression reused Task007 artifacts without research/API calls. Task002's planning and Task003 dry-run paths remain offline.
- Outputs: `assets/generated/paradox-of-choice/choice-door-v1.png`, `choice-person-v1.png`, `asset-manifest.json`, `asset-registry.json`, and `preview.html`. Generation state/report remain ignored under `generated/paradox-of-choice/`.
