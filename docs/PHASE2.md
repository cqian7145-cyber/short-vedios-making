# Phase 2 — Recraft Visual System

Phase 2 uses Recraft as the only external visual generation provider and Remotion as
the final compositor and renderer. Recraft primarily creates atomic illustrations,
icons, objects, and characters. Remotion owns scene layout, typography, charts,
formulas, procedural
animation, camera motion, compositing, and final MP4 rendering.

OpenAI Image, Midjourney, Seedance, and Canva are outside this architecture. DeepSeek,
Tavily, Research, Fact Pack, and Factory v1 remain Phase 1 services and do not depend
on Recraft.

## Selected profile

Phase 2 Task001 currently validates `Midnight Scientific Editorial v2`
(`midnight-scientific-editorial-v2`), using six semantically simple references. The
earlier public style (41/100) and custom v1 style (63/100) remain rejected historical
attempts. Style identifiers are never stored in tracked source, reports, manifests, or
logs. Resolution order is `RECRAFT_STYLE_ID` in the environment, then the ignored
`.recraft-style.local.json` state file.

Phase 1 keeps its dark academic/editorial world: near-black or dark navy background,
ivory typography, restrained gold highlights, technical diagrams, negative space,
and slow cinematic motion. Recraft supplies visual subjects. Remotion adds information
and motion around those subjects.

## Commands

- `npm run phase2:preflight` — configuration state only; no secrets are printed.
- `npm run recraft:style-status` — selected profile and locked/missing status.
- `npm run recraft:validate-midnight-style` — rasterizes six original V2 reference SVGs,
  creates exactly one custom style when neither environment nor local state has an ID,
  immediately persists a new ID to ignored local state, and generates six atomic
  validation images. Use `--force` only to replace generated paid outputs. The CLI
  never prints the identifier.
- `npm run recraft:score-midnight-style` — scores a completed local assessment using
  the explicit semantic-failure and human-approval lock gates.
- `npm run recraft:validate-style` — the earlier public-style validation record.

Generated validation images are local and ignored by Git. The manifest and style
report do not contain credentials or the style identifier. A generated image set
remains `needs-review` until the assets are checked against the human review sheet.
An API response alone never locks a style.

The new style creation uses Recraft's documented `POST /v1/styles` multipart flow,
with six PNG references, `model=recraftv3`, the documented `digital_illustration`
base, and `match=regular`. The same `recraftv3` model is used for validation images.
The ignored state file allows reuse after the process exits; users may optionally copy
the value into `.env` themselves. The value is omitted from reports and console output.

## V2 roadmap

- V2-01 — Recraft style lock and validation (current Task001).
- V2-02 — episode asset strategy and controlled asset generation.
- V2-03 — asset normalization and compositing.
- V2-04 — Remotion hybrid scenes.
- V2-05 — visual quality and similarity checks.
- V2-06 — cross-episode asset reuse.
- V2-07 — Factory v2.

## Task V2-02 — Asset Strategy Director

The AssetPlan is separate from Task007's VisualPlan. VisualPlan states a scene's visual
concept; AssetPlan routes production between Recraft atomic subjects and procedural
Remotion graphics. Hybrid is preferred when illustrated subjects accompany precise
information graphics. Auction paddles are high risk, precise branching diagrams are
procedural-only, and duplicate motifs use `reuseKey` to avoid repeat generations.

```powershell
npm run plan:assets -- --episode episodes/generated/paradox-of-choice.json --visual-plan generated/paradox-of-choice/visual-plan.json --facts research/paradox-of-choice/fact-pack.json --dry-run
```

This offline planning command writes `asset-plan.json` and `asset-strategy-report.json`
under `generated/<episode-id>/`; it never calls Recraft. Optional `--model` enables a
bounded DeepSeek proposal, followed by deterministic local policy enforcement. See
[Asset Strategy](ASSET_STRATEGY.md) and [Task V2-02](tasks/PHASE2_TASK_002.md).

## Official API references

- [Recraft generation endpoints](https://www.recraft.ai/docs/api-reference/endpoints)
- [Image inputs and results](https://www.recraft.ai/docs/api-reference/image-inputs-and-results)
- [Recraft V4 Styles](https://www.recraft.ai/docs/api-reference/models/recraft-v4-styles)
- [Style matching](https://www.recraft.ai/docs/api-reference/styles)
- Detailed implementation notes: [RECRAFT_API_NOTES.md](RECRAFT_API_NOTES.md).
