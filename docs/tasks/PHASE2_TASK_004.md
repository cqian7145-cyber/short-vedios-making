# Phase 2 Task V2-04 — Hybrid Remotion Scene Composer

## Goal

Compose existing Episode, VisualPlan, AssetPlan, generated asset manifest, and local review decisions into a safe, deterministic hybrid MP4. Upstream research and generation are not rerun.

## Requirements

- Safe-by-default review state: missing entries are pending; pending assets fall back unless the explicit draft flag is set; rejected assets never render.
- Preserve procedural scene graphics and Remotion information overlays alongside reviewed illustrations.
- Deterministic semantic layouts, alpha-aware handling, subtle frame-driven movement, reuse continuity, signature composition, and AgentToken character fallback.
- Produce an input snapshot, render report, 8–10 hybrid QA stills, and matched Phase 1/Phase 2 comparisons.
- Keep Phase1 `EpisodeVideo`, `render:episode`, and Task008 factory independent of Recraft.
- Never call Recraft, DeepSeek, Tavily, or OpenAI from hybrid composition/tests.

## Implementation

- `src/composition/assetResolver.ts` resolves review decisions, verifies PNGs and hashes, stages only usable images, and records fallback reasons.
- `src/composition/layoutResolver.ts` creates deterministic semantic layouts and avoids runs longer than two identical layouts.
- `src/composition/productionContext.ts` validates scene alignment and builds secret-free snapshots and report metrics.
- `src/engine/HybridAssetLayer.tsx` composites images using alpha metadata, semantic layout bounds, and frame-based movement; `HybridFallbackLayer.tsx` uses the existing procedural AgentToken.
- `scripts/review-asset.ts` maintains local review state; `scripts/render-hybrid.ts` runs rendering and QA still generation.
- `tests/hybridComposer.test.ts` exercises review gates, fallback, alpha, deterministic staging, reuse, layout diversity, signature handling, report safety, and zero provider calls.

## Acceptance Criteria

- Approved assets can render; missing and pending assets fall back by default; `--allow-pending-assets` labels the output as a draft; rejected assets always fall back.
- Rejected person imagery is replaced by an AgentToken. Door imagery remains pending unless a human explicitly approves it.
- Staging is reproducible and source assets remain unchanged.
- Existing Phase 1 render and factory continue to work without Recraft configuration.
- Tests, typecheck, episode validation, safe hybrid render, pending-asset draft render, and Phase 1 regression render pass.

## Evidence

- `npm test` — passed, 130 tests including 15 offline hybrid-composer tests; no live provider calls.
- `npm run typecheck` — passed.
- `npm run validate:episodes` — passed for `braess-paradox.json`, `dollar-auction.json`, and the existing local `test-variant.json`.
- `npm run render:episode -- episodes/braess-paradox.json` — passed; Remotion reported 1920×1080, 30 FPS, 1800 frames, 60 seconds.
- Safe `npm run render:hybrid ...` — passed; 1920×1080, 30 FPS, 1802 frames, 60.0667 seconds. The pending door and rejected character were excluded; the rejected character used the procedural AgentToken. Ten QA stills and ten matched comparison stills were generated.
- Draft `npm run render:hybrid ... --allow-pending-assets` — passed; `DRAFT — UNREVIEWED ASSETS`, one pending door staged, person stayed rejected, and the report warns about its opaque-background matte. Ten hybrid QA stills plus ten Phase 1/Phase 2 matched stills were generated and the signature comparison still was visually inspected.
- Outputs: `output/braess-paradox.mp4`, `output/paradox-of-choice-hybrid.mp4`, and `output/paradox-of-choice-hybrid-draft.mp4`. Generated outputs and review state are ignored and not committed.
- Recraft, DeepSeek, Tavily, OpenAI, TTS, voice-over, and music were not used by the composer or tests.
