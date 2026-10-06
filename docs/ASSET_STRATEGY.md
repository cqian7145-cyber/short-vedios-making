# Phase 2 Asset Strategy Director

Asset Strategy is a production-routing layer between Task007's VisualPlan and any
future asset generation. VisualPlan keeps describing the visual idea for a scene;
AssetPlan decides which parts should be illustrated assets and which parts must stay
procedural. The Episode and Fact Pack are read-only inputs.

## Division of work

- **Recraft** creates atomic illustrated subjects: people, ordinary objects, machines,
  vehicles, architecture, industrial objects, and editorial illustrations.
- **Remotion/SVG/Canvas/CSS** creates exact diagrams, networks, branches, charts,
  formulas, arrows, timelines, probability structures, labels, and animation.
- **Hybrid** combines a Recraft subject with precise Remotion information graphics. It
  is the preferred route for an illustrated knowledge scene.

No full infographic or text-heavy scene is sent to Recraft. Current Task001 evidence
records auction paddles as high semantic risk and precise branching diagrams as
procedural-only. Local policy has the final say even if a future model proposes an
unsafe route.

## AssetPlan

`src/assets/assetStrategySchema.ts` defines an independent strict schema. Every scene
uses exactly one strategy:

- `procedural` — Remotion/SVG/Canvas/CSS draws the complete visual.
- `recraft` — a new atomic Recraft subject is the primary visual.
- `hybrid` — an illustrated subject and procedural information graphics work together.
- `reuse` — a previous or library Recraft asset is reused.

An asset brief describes only semantic content: kind, subject, composition, viewpoint,
isolation, reuse key, risk, and concepts to avoid. It cannot contain CSS, coordinates,
font sizes, React/SVG code, keys, or Style IDs.

## Policy and deterministic baseline

`assetStrategyPolicy.ts` proposes assets from stable subject/archetype cues and then
applies local policy. Recraft-ineligible elements are kept in `proceduralElements`.
Machine plus chart and character plus relationships become hybrid. Network, precise
branching, diagrams, formulas, and charts remain procedural. High-risk subjects prefer
procedural or curated SVG fallback. Duplicate reuse keys are linked to one asset and do
not increase the generation budget.

DeepSeek proposals are optional (`--model`). The default and `--dry-run` paths use the
deterministic heuristic. A DeepSeek proposal gets one bounded schema/scene-order repair;
the local routing policy runs after every valid proposal. The planning command never
calls Recraft.

## Budget and QA

The budget counts unique new Recraft assets, not scene occurrences:

| Episode duration | Recommended unique assets | Hard maximum |
| --- | ---: | ---: |
| Up to 119 seconds | 2–4 | 5 |
| 120–180 seconds | 4–7 | 8 |

The strategy report warns above 70% Recraft-involved scenes and when episodes of at
least 60 seconds have no fully procedural scene. It fails when the unique-asset hard
limit is exceeded or all scenes are Recraft-involved. High semantic risk and local
policy overrides are reported.

## Existing asset reuse

The planner scans `assets/generated/` and `assets/library/` for
`asset-registry.json` or `registry.json` files matching the strict registry schema. It
only reuses a registry entry when its local file exists and stays inside the workspace.
Missing directories are normal. Repeated episode motifs share a `reuseKey` and are
planned once.

## Command

```powershell
npm run plan:assets -- --episode episodes/generated/paradox-of-choice.json --visual-plan generated/paradox-of-choice/visual-plan.json --facts research/paradox-of-choice/fact-pack.json --dry-run
```

The command writes `generated/<episode-id>/asset-plan.json` and
`generated/<episode-id>/asset-strategy-report.json`. Add `--force` to replace these
outputs. Add `--model deepseek-flash` to request a model proposal; this uses DeepSeek
but still does not call Recraft. Neither output contains API keys or Style IDs.

## Task003 execution

Task002 decides which assets are new, reused, or procedural. Task003 generates only
the unique `source: new` assets and resolves registry/cache reuse without silently
creating replacements. See [Recraft Asset Generation](RECRAFT_ASSET_GENERATION.md).
