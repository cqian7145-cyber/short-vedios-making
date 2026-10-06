# Hybrid Factory V2

Factory V2 orchestrates the existing Phase 1 Factory and Phase 2 asset, hybrid
composition, and visual-QA modules. It does not replace the Phase 1 Factory or
reimplement research, Recraft requests, asset resolution, rendering, or QA.

```text
Task001 style profile
  → Task002 AssetPlan
  → Task003 Library/cache resolution and bounded Recraft generation
  → Task004 Remotion hybrid composition
  → Task005 approved library reuse
  → Task006 local visual QA
  → Task007 Factory V2 review and release orchestration
```

## Commands

```powershell
npm run factory:v2 -- --topic "Why can more choice make decisions harder?" --id example-episode --duration 60 --draft
npm run factory:v2:review -- --episode example-episode --approve --note "Reviewed the draft and listed QA warnings."
npm run factory:v2 -- --id example-episode --resume --release
npm run factory:v2:review -- --episode example-episode --request-changes --note "Revise the scene transition."
```

The initial command prints planned DeepSeek/Tavily use. It checks Task003's cache
and the approved Asset Library before Recraft, enforces the AssetPlan hard limit
and a Factory V2 ceiling of three new images by default, and stops before paid
generation if the limit would be exceeded. High-risk generation is off unless
`--allow-high-risk` is explicit. A plan fully served by procedural work, Library,
or cache uses zero Recraft calls.

## Draft and release

Drafts allow visible pending assets and carry an on-frame label:
`DRAFT — UNREVIEWED ASSETS`, or `DRAFT — NOT RELEASE APPROVED` when none are
pending. Rejected assets always use the existing procedural fallback. The pipeline
renders the hybrid video, runs `qa:visual`, and creates
`deliveries/<id>/review/` with the draft, review page, asset preview when available,
QA report, stills, checklist, and source summary. It then exits successfully in
`AWAITING HUMAN REVIEW`.

`factory:v2:review --approve` approves only pending assets that appear in the saved
draft render input. Rejected assets cannot be revived, and unshown assets remain
pending. The review records the QA warning codes that were visible at approval.
`--request-changes` records a pause without guessing what to change.

Release requires a publication-ready Fact Pack, a valid Episode and AssetPlan,
approved or procedural assets in the final render, a fresh QA run, and human
approval. QA warnings proceed only when the approved review acknowledged the same
warning codes. QA failure stops release unless `--override-qa-fail` is paired with
`--override-reason` and human approval. The safe release render reruns Visual QA
and packages `final.mp4`, Episode/plan/manifests, sources, QA, and a hash manifest
under `deliveries/<id>/`. Music remains user-supplied; YouTube upload remains manual.

## State and safety

State and reports are local under `runs/<id>/factory-v2-state.json` and
`factory-v2-report.json`; review decisions are local under
`generated/<id>/factory-v2-review.json`. Atomic state writes and an episode lock
protect resumable runs. Stage fingerprints record inputs, render fingerprints
include review state, and review approval invalidates render and QA without
changing research artifacts. Dead/stale locks can be recovered. No key,
authorization data, or Recraft Style ID is written to reports or delivery.

`--existing-artifacts` is for offline integration of Task007 and Phase 2 outputs.
It validates and consumes saved files without running research or paid providers.
This was used for the Paradox of Choice integration smoke.

Factory V1 remains available as `npm run factory`; Recraft is not required by it.
Automated tests use local fixtures and do not make provider requests.
