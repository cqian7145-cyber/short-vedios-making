# Phase 2 Hybrid Scene Composer

V2-04 consumes the already generated Episode, VisualPlan, AssetPlan, Recraft asset manifest, and local asset review state. It does not run research or call DeepSeek, Tavily, Recraft, OpenAI, or any other provider.

## Review before rendering

Assets without an entry in `assets/generated/<episode-id>/asset-review.json` are pending. Safe rendering treats pending assets as unavailable; rejected assets can never be included. Explicitly review an asset with:

```powershell
npm run review:asset -- --episode paradox-of-choice --asset choice-door-v1 --approve --note "Reviewed for the dark scene composition."
npm run review:asset -- --episode paradox-of-choice --asset choice-person-v1 --reject --note "Visible generated numerals; use the procedural AgentToken fallback."
```

The current person asset has visible numerals 1, 2, 4, and 5 and is explicitly rejected in local review state. The door remains pending until a human approves it. No image is auto-approved.

## Render

```powershell
npm run render:hybrid -- --episode episodes/generated/paradox-of-choice.json --visual-plan generated/paradox-of-choice/visual-plan.json --asset-plan generated/paradox-of-choice/asset-plan.json --manifest assets/generated/paradox-of-choice/asset-manifest.json
```

This safe mode falls back for pending and rejected assets. To inspect pending imagery, render a visibly marked draft:

```powershell
npm run render:hybrid -- --episode episodes/generated/paradox-of-choice.json --visual-plan generated/paradox-of-choice/visual-plan.json --asset-plan generated/paradox-of-choice/asset-plan.json --manifest assets/generated/paradox-of-choice/asset-manifest.json --allow-pending-assets --output output/paradox-of-choice-hybrid-draft.mp4
```

Rejected imagery remains excluded in draft mode. The output status becomes `DRAFT — UNREVIEWED ASSETS` whenever pending assets are allowed and exist.

The renderer validates scene IDs/order, reads the local review state, stages only eligible PNGs under ignored `public/generated-assets/<episode-id>/`, checks source and staged SHA-256 hashes, and never changes source assets. Layout variants are deterministic and avoid more than two consecutive identical layouts. Reuse references share a single staged file. Transparent assets are composited as alpha; generated-background assets use a soft radial matte and `lighten` blend mode. These backgrounds can still produce a visible matte and are recorded as a compositing warning; do not count a successful file render as human-approved visual compatibility. The signature scene uses a restrained split composition to leave the Remotion information layer readable. Illustration motion is subtle and based on Remotion frames. Existing procedural scene graphics, charts, labels, formulas, and paths remain in the composition; rejected character assets use the procedural `AgentToken` fallback.

## Outputs

- MP4: `output/<episode-id>-hybrid.mp4` (or the `--output` value)
- Deterministic input snapshot: `generated/<episode-id>/hybrid-render-input.json`
- Render report: `generated/<episode-id>/hybrid-render-report.json`
- 8–10 QA stills: `qa/<episode-id>/hybrid/`
- Matched Phase 1/Phase 2 stills: `qa/<episode-id>/comparison/phase1/` and `.../hybrid/`

Snapshots and reports contain local review decisions, semantic scene intent, staged paths and hashes, counts, layouts, fallbacks, and render status. They contain no API credentials or Recraft Style ID. Reports distinguish approved/pending/rejected assets, procedural/hybrid/Recraft/reuse scene counts, fallback reasons, signature moment rendering, and the illustration-dominant scene ratio. The ratio counts a scene only when the illustration is the information carrier without planned procedural elements; hybrid overlay scenes do not inflate it.

The existing `EpisodeVideo` composition and `npm run render:episode` remain backward compatible. V2-04 is optional to the Phase 1 factory and does not require Recraft credentials.
