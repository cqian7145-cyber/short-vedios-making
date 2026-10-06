# Phase 2 Task V2-02 — Asset Strategy Director

## Goal

Create a standalone production-routing plan from Episode, Fact Pack, VisualPlan,
registered visual capabilities, Recraft capability rules, style profile, and current
style configuration. Do not change VisualPlan, Episode facts, or Fact Pack claims.

## Implementation

- Added an independent strict AssetPlan and strategy proposal schema.
- Added a deterministic local baseline and final policy enforcement for the four routes:
  `procedural`, `recraft`, `hybrid`, and `reuse`.
- Kept exact information graphics procedural and atomic illustrated subjects eligible
  for Recraft; mixed scenes prefer hybrid.
- Added Task001-derived auction paddle risk and precise branching procedural rules.
- Added a unique-asset budget, episode/library reuse detection, registry validation,
  strategy QA report, optional bounded DeepSeek proposal repair, and `plan:assets` CLI.
- Planning is offline by default and never invokes Recraft. `--dry-run` works without a
  Recraft Style ID.

## Acceptance criteria

- [x] AssetPlan remains separate from VisualPlan.
- [x] All four routing strategies are supported.
- [x] Procedural-only concepts cannot remain assigned to Recraft.
- [x] Auction paddle is high risk; branching diagrams are procedural-only.
- [x] Reuse and unique-asset budgets are enforced.
- [x] Model policy overrides and one bounded repair are tested.
- [x] No secret or Recraft provider request is part of planning.
- [x] Paradox-of-choice dry-run outputs both plan and report.
- [ ] Final independent review of generated AssetPlan outputs.

## Evidence

Paradox-of-choice dry-run (2026-10-06):

- Command: `npm run plan:assets -- --episode episodes/generated/paradox-of-choice.json --visual-plan generated/paradox-of-choice/visual-plan.json --facts research/paradox-of-choice/fact-pack.json --dry-run --force`
- 8 scenes: procedural 1, hybrid 6, recraft 0, reuse 1.
- 2 unique new Recraft assets (door and person) against a 5-asset hard budget; 12
  reused asset placements; one local policy override.
- Precise network/chart/probability elements remain procedural. The single
  branching/network scene is procedural.
- QA status is `warning` because 75% of scenes involve Recraft; this is above the
  requested 70% warning threshold. It is not a planning failure.
- `npm test` — passed; `npm run typecheck` — passed; `npm run validate:episodes` — passed.
- Task008 Factory reuse regression passed within `npm test`; no research or Recraft API
  calls were made by this Task002 smoke.
- Plan and report are local generated artifacts under `generated/paradox-of-choice/`
  and remain ignored by Git.
