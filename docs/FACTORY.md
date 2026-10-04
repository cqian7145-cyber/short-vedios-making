# One-command Verified Video Factory — Task 008

`npm run factory` orchestrates existing pipeline stages into resumable, reviewable outputs. It does not perform voice-over, TTS, music generation/synchronization, image generation, or YouTube upload.

## Quick start

```powershell
npm install
npm run factory -- --topic "Why can more choices make decisions worse?" --id paradox-of-choice --duration 150
```

`--id` is required. A new run also requires `--topic`; `--resume` can recover the topic from saved state. `--duration` is an integer from 30 to 600 seconds and defaults to 150 for a new run. Node.js 20 or newer is required. DeepSeek and Tavily credentials are checked only if a missing stage needs them. The factory loads `.env` using dotenv; `.env` and other `.env.*` files are ignored by Git, while `.env.example` contains empty placeholders.

## Stages

1. Preflight: validate options/runtime, protect existing output, check only credentials required by missing work, and save run configuration.
2. Content Brief: reuse a valid same-topic saved brief or generate and validate one.
3. Research Plan: reuse the saved plan or ask DeepSeek for bounded queries.
4. Research: reuse saved sources or call Tavily.
5. Fact Pack: reuse the matching validated Task007 Fact Pack, otherwise assess the saved sources.
6. Verified Episode: reuse and validate a matching Episode or generate one using the Fact Pack and brief.
7. Visual Plan: reuse and validate a scene-matched Task007 VisualPlan or create a new one.
8. Quality Gates: check publication readiness and source presence; for 120–180 second episodes also require diversity score ≥50, ≥4 archetypes, repeated run ≤2, network ratio ≤50%, text-dominant ratio ≤60%, and a signature moment. At most one Task008 VisualPlan quality repair is attempted. `--draft` records failed gates as explicit warnings and marks the package for human review.
9. Render: use saved Episode JSON and resolved visual strategies with Remotion/FFmpeg. This stage does not need DeepSeek or Tavily.
10. Delivery Package: write metadata, chapter marks, source list, claim trace, report, render path, and human review checklist.

The 120–180 second requirements are enforced as a release gate. Shorter integration runs still report visual QA, but production diversity requirements are informational. A release candidate is not a guarantee that the video is factually or aesthetically approved; the included review checklist requires a person to inspect facts and visuals.

## Reusing Task007 artifacts

With the same ID and topic, the factory reads (in priority order) saved run checkpoints and existing artifacts including:

- `research/<id>/content-brief.json`
- `research/<id>/fact-pack.json`
- `research/<id>/sources.json` and `research/<id>/research-plan.json`
- `episodes/generated/<id>.json`
- `generated/<id>/visual-plan.json`

Each checkpoint is parsed against its local schema and topic/scene mapping before reuse. A valid Fact Pack skips query planning, Tavily, and Fact Pack assessment. A valid Episode skips generation. A valid VisualPlan skips visual planning. Missing or invalid downstream checkpoints can be regenerated from upstream artifacts; a topic mismatch is not silently reused. `--force` ignores existing checkpoints for the run and replaces the output MP4; it does not delete the research tree. `--resume` reuses checkpoints in `runs/<id>/` and permits an existing delivery/output path.

Example: after Task007 has created the artifacts for `paradox-of-choice`, run:

```powershell
npm run factory -- --topic "Why can more choices make decisions worse?" --id paradox-of-choice --resume
```

No research is repeated if its validated Fact Pack is still present and matches the topic.

## Outputs

- `runs/<id>/`: stage checkpoints, `factory-config.json`, `factory.log`, `09-factory-report.json`, `08-visual-qa.json`, and `claim-trace.json`.
- `output/<id>.mp4`: 1920×1080, 30 FPS, no audio.
- `qa/<id>/frame-*.png`: 8–12 deterministic representative Remotion frames, including a signature-moment frame when possible.
- `deliveries/<id>/`: Episode, Fact Pack, VisualPlan, source list, YouTube metadata/chapter draft, claim trace, factory report, review checklist, and MP4 link/copy.

`factory.log` and generated run data are local/ignored. Reports contain only stage status, model name, token usage, planned/executed research query counts, validation metrics, and paths; credentials and Authorization headers are redacted. Source text and API payloads are not copied to logs.

## CLI options

```text
--topic <text>        Topic for a new run
--id <kebab-case>     Stable run/artifact ID
--duration <30..600>  Target duration in seconds (default: 150)
--model <name>        DeepSeek model override
--max-sources <3..40> Research source cap (default: 20)
--brief <path>        User brief (ContentBrief JSON or text context)
--facts <path>        Explicit Fact Pack JSON
--resume              Recover/reuse an existing run
--force               Ignore checkpoints and overwrite generated MP4
--draft               Package with explicit draft status if a gate fails
--skip-render         Build checkpoints and review package without MP4
```

Use `npm run factory -- --help` to print usage.

## Offline verification

`npm test`, `npm run typecheck`, and `npm run validate:episodes` use local files and mocks. The Task008 integration test copies the current Task007 artifacts into a temporary directory and asserts that the factory reuses Fact Pack/Episode/VisualPlan with zero LLM calls and zero research calls. The full factory can be run without any API keys when all required artifacts are already valid. Rendering and representative still-frame extraction are local Remotion work.
