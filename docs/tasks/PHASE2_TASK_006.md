# Phase 2 Task 006 — Visual Consistency + Similarity QA

## Goal

Add an offline deterministic inspection and release-gate interface for within-Episode visual consistency and bounded cross-Episode repetition. The system reports explainable editorial heuristics and leaves all art direction decisions to a human.

## Requirements

- Read Episode, VisualPlan, AssetPlan, Task004 hybrid report/snapshot, PNG stills, and optional recent QA history.
- Check layout and archetype diversity, illustration balance, motif/asset repetition, frame hashes, relative palette drift, structural signatures, signature moments, cross-Episode hooks/endings/reuse, stale inputs, and procedural/illustration mix.
- Produce JSON, local HTML, a human review sheet, and latest-per-Episode history.
- Make no provider calls, image generations, renders, approvals, or MP4 mutations.
- Preserve Phase 1 Factory and Phase 2 Tasks V2-01 through V2-05 contracts.

## Implementation

- Added `src/visual-qa/` schemas, local PNG dHash/palette extractor, rule metrics, scoring, recommendations, history conversion, and release gate result.
- Added `scripts/visual-qa.ts` and `npm run qa:visual`.
- Added 33 offline QA tests with generated PNG fixtures; existing project tests remain in the test command.
- Added `docs/VISUAL_QA.md`; linked the Task V2-06 operational contract from Phase 2, Hybrid Composer, Asset Library, and README.
- Added `pngjs` as a local PNG decoder. No AI/provider dependency or live credentials are used by QA.

## Acceptance Criteria

- [x] Typed report contains within-Episode, cross-Episode, score, warning, recommendation, freshness, and gate data.
- [x] Layout/archetype/illustration/asset/structure/signature/palette/similarity rules are deterministic and covered offline.
- [x] Local bounded history is latest-per-Episode and capped at 20.
- [x] PNG similarity and palette features are computed locally; thresholds are explicitly heuristic.
- [x] CLI emits report, local HTML, human review sheet, and local history.
- [x] Pending Task004 draft assets and opaque matte notes keep the release gate at human review.
- [x] Paradox hybrid draft is inspected without rerunning image generation or rendering.
- [x] Required tests, typecheck, episode validation, and regressions are recorded below.
- [x] Commit and push evidence is recorded below.

## Evidence

Commands and results:

- `npm install pngjs` and `npm install -D @types/pngjs` — installed local PNG decoding and TypeScript declarations; npm reported 0 vulnerabilities.
- `npm run qa:visual -- --episode generated/paradox-of-choice/episode.validated.json --visual-plan generated/paradox-of-choice/visual-plan.json --asset-plan generated/paradox-of-choice/asset-plan.json --hybrid-report generated/paradox-of-choice/hybrid-render-report.json --stills qa/paradox-of-choice/comparison/hybrid --phase1-stills qa/paradox-of-choice/comparison/phase1 --compare-history --history-limit 5` — heuristic score 100/100, status WARNING, 5 layouts, 6 archetypes, 0% illustration dominance, 8 representative stills, 0 high-similarity pairs, and 8 matched Phase 1/hybrid comparisons (mean dHash similarity 0.953). Warning and human-review gate preserve the draft's pending door and possible matte edge; the score is not approval.
- The Paradox draft report retains its source `DRAFT — UNREVIEWED ASSETS` state; pending door and rejected-person fallback policy were not changed. No images were generated and no MP4 was rerendered or modified.
- `npm test` — PASS, 193 tests (all passed, no skipped tests).
- `npm run typecheck` — PASS.
- `npm run validate:episodes` — PASS; Braess, Dollar Auction, and the existing local test variant validated.
- `npm run library:doctor` — PASS; 0 local indexed assets, no library state changes.
- Cross-Episode fixtures cover hook/ending repetition, history limit, metadata-only entries, and stale input fingerprints. No prior distinct QA report existed for the CLI smoke, so the current Paradox history comparison contained 0 previous episodes.
- Main code: `src/visual-qa/`, `scripts/visual-qa.ts`, and `tests/visualQa.test.ts`.
- Local-only artifacts: `generated/paradox-of-choice/visual-qa-report.json`, `qa/paradox-of-choice/visual-qa.html`, `qa/paradox-of-choice/VISUAL_REVIEW.md`, and `qa/history/index.json`.
- Commit and push evidence is recorded after final diff review.
