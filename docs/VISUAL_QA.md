# Task V2-06 — Visual Consistency and Similarity QA

Task V2-06 adds a deterministic, offline editorial inspection pass across an Episode, VisualPlan, AssetPlan, Task004 Hybrid Render Report, representative PNG stills, and a bounded local QA history. It observes and reports; it does not create images, alter video renders, approve assets, or publish episodes.

All visual measurements are explainable heuristics, not scientific scores and not AI visual understanding. No Recraft, DeepSeek, Tavily, OpenAI, vision, or embedding API is used. PNGs are decoded locally with `pngjs`; 64-bit dHash is used as a visual-repetition signal only. A human decides aesthetics, semantic accuracy, embedded text, and compositing quality.

## Run

```powershell
npm run qa:visual -- --episode generated/paradox-of-choice/episode.validated.json --visual-plan generated/paradox-of-choice/visual-plan.json --asset-plan generated/paradox-of-choice/asset-plan.json --hybrid-report generated/paradox-of-choice/hybrid-render-report.json --stills qa/paradox-of-choice/comparison/hybrid --phase1-stills qa/paradox-of-choice/comparison/phase1 --compare-history --history-limit 5
```

`--hybrid-report`, `--stills`, and `--phase1-stills` are optional. The CLI also reads the sibling `hybrid-render-input.json` snapshot when present for exact Task004 per-scene layout, resolved strategy, staged assets, and signature marker. If stills use `<scene-id>.png`, they are mapped directly. Otherwise, sorted `frame-NN.png` samples are assigned evenly to Episode scene order; that mapping is a representative-sample approximation because the Task004 still filenames do not carry source frame numbers. Only PNGs are decoded. `--phase1-stills` compares matched Task004 Phase 1 and hybrid dHashes and makes no aesthetic ranking. The default history limit is 5; valid range is 1–20. QA history always keeps only the latest entry for a given Episode and at most 20 Episodes.

## Metrics and rules

- Layouts use Task004's six resolved layouts. Episodes of at least 60 seconds warn below three layouts, after a run longer than two scenes, and when a single layout exceeds 50%; 75% is a critical fail.
- Archetypes come from Task007 VisualPlan primary archetypes. Long Episodes with fewer than three archetypes warn; over 60% warns; a single archetype across the Episode is critical.
- Illustration dominance comes from Task004's `illustrationDominantSceneRatio`, so hybrid scenes with procedural information overlays do not count as illustration slides. Above 60% warns; at least 80% is critical.
- Asset reuse is not intrinsically penalized. A persistent motif can exempt repeated asset IDs when its semantic terms match the asset; otherwise, use in more than half of scenes warns.
- Frame similarity compares bounded representative still sets, not every video frame. Identical 64-bit dHash is 100% similar; pairs at or above 94% are review candidates. Adjacent scenes contribute at 75% weight and need at least 98.5% similarity to become a warning. This is a heuristic threshold, not an artistic-quality score.
- Palette checks use mean luminance and saturation relative to the Episode medians. A non-signature scene is a drift candidate when luminance differs by more than 0.22 or saturation by more than 0.30. Signature moments are allowed intentional contrast.
- Structural signatures combine primary archetype, resolved layout, strategy, asset-kind set, and procedural-element set. A repeated run of three warns; a structure above half of scenes warns; 75% is critical.
- Signature moment checks compare immediate neighbors by layout, archetype, and available dHash.
- Task004 `DRAFT — UNREVIEWED ASSETS`, pending asset counts, and known matte/background warnings remain visible QA warnings; they require human review even when the weighted metrics score highly.
- Cross-Episode mode checks at most the configured latest reports, hashes, asset IDs, and hook/ending signatures. It does not scan source media or run all-frames comparisons.

The weighted 0–100 editorial score uses layout 15, archetype 15, frame repetition 15, structure 15, palette 10, asset reuse 10, illustration balance 10, and signature distinctiveness 10. A score of 80+ is pass, 65–79 warning, and below 65 fail; configured critical rules can override the score. The release gate is an interface for Factory V2: pass continues, warning requires human review, fail stops release-candidate progression. Task V2-06 itself never removes or changes an MP4.

## Outputs and safety

- `generated/<episode-id>/visual-qa-report.json`
- `qa/<episode-id>/visual-qa.html`
- `qa/<episode-id>/VISUAL_REVIEW.md`
- `qa/history/index.json`

The dashboard is a local HTML inspection page with representative stills, layout and archetype summaries, similar pairs, warnings, palette notes, asset usage, and recommendations. When matched Task004 Phase 1 and hybrid stills are supplied, the JSON report stores paired dHash values as structural pixel-feature differences only; it does not rank aesthetics. The human review sheet covers style identity, bright scenes, repeated layouts, signature distinction, illustration integration, text artifacts, matte edges, and opening/ending variety. QA reports store input SHA-256 fingerprints; rerunning after an input changes marks the previous report stale in the replacement report. The history index stores only latest-per-Episode summaries and is local/ignored by Git.

Use Task004's existing Paradox draft to exercise illustration and fallback context. Its door asset stays pending and the rejected person remains excluded. A draft warning is preserved. QA does not regenerate the asset or render the MP4. Task005 continues to accumulate approved reusable assets, Task006 inspects consistency, and Task007 automates the later release pipeline.

## Testing

Automated tests use generated PNG fixtures and mock/no providers. They cover thresholds, similarity determinism, palette drift, history limits, stale fingerprints, immutable input objects, preserved MP4s, and recommendations. Offline QA smoke for the existing Paradox inputs is recorded in `docs/tasks/PHASE2_TASK_006.md`.
