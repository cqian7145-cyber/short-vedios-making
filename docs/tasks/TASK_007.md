# Task 007 — Research + Fact Pack + Visual Director

## Goal

Add bounded source research and claim traceability to Task006, then produce a capability-aware, concept-specific VisualPlan without replacing Episode schema v1 or adding a renderer per archetype.

## Requirements

- Tavily `ResearchProvider` plus fixture-backed `MockResearchProvider`; API key from environment only.
- 3–8 targeted queries and bounded result/source counts; deduplicated and tiered source records.
- Fact claims cite source IDs and pass a local confidence/quality gate. Preserve uncertainty and contradictions; keep draft rendering possible while reporting publication readiness.
- Verified generation may use only verified factual claims and safe conceptual claims.
- Visual Director selects from at least twelve archetypes, maintains a motif, names a signature moment, and respects engine capability/fallback data.
- Automatic diversity audit, research/visual planning CLIs, docs, offline tests, Task005/006 compatibility.

## Implementation

`src/research/` owns provider contracts, Tavily/mock implementations, source tiering, Zod schemas, query planning, evidence assessment, verification policy, deduplication, and Fact Pack output. `src/visual/` owns the VisualPlan schema, archetype set, capability registry, model planner, and diversity heuristic. CLI entry points are `research:episode`, `plan:visuals`, and `generate:verified`.

## Acceptance Criteria

- [x] Research provider and offline mock fixture.
- [x] Environment-only Tavily key, redacted provider errors.
- [x] Query and source caps, URL deduplication, A/B/C quality tiers.
- [x] Claim/source linkage, verification downgrade rules, publication gate.
- [x] Injection boundaries and citations in `sources.md`.
- [x] Twelve visual archetypes, strict VisualPlan, capability registry and fallbacks.
- [x] Diversity report, repeated-run and network-ratio checks.
- [x] Three requested CLI commands and documentation.
- [x] Task005/006 schema and generation compatibility.
- [x] `npm run typecheck` passed.
- [x] `npm test` passed: 37 tests, 0 failures, all offline/mock-backed.
- [x] `npm run validate:episodes` passed for Braess, Dollar Auction, and the preserved test-variant.
- [x] Braess regression render passed: `output/braess-paradox.mp4`, 1920×1080, 30 FPS, 60 seconds.
- [x] Paradox-of-choice Episode v1 validated: 8 scenes, 1802 frames (60.07 seconds).
- [x] Visual Director mock provider flow produced a valid five-archetype plan and QA report.
- [ ] Real Tavily search and live DeepSeek VisualPlan smoke blocked: both keys are absent from the current process environment.

## Evidence

Code and offline acceptance are complete. No live Tavily call or live DeepSeek VisualPlan response was made because `TAVILY_API_KEY` and `DEEPSEEK_API_KEY` were absent from the process environment. The Fact Pack and VisualPlan live artifacts are therefore not claimed as smoke outputs.

The current `.env.example` has blank credential placeholders; the previous tracked history had no non-empty DeepSeek or Tavily key assignment. The existing `episodes/test-variant.json` remains unmodified and uncommitted, and the pre-Task005 stash was preserved.
