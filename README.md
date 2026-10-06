# Vibe Knowledge Video Engine

A deterministic, Remotion-based visual engine for cinematic English-language knowledge videos. Task 001 establishes the foundation, Task 002 defines the shared visual design system, Task 003 adds reusable frame-driven animation primitives, and Task 005 makes the engine JSON-driven. Task 006 adds optional, explicit DeepSeek content drafting; the repository contains no embedded API credentials. There is no narration, TTS, or audio pipeline.

## Task roadmap

001 Foundation · 002 Visual Design System · 003 Animation Components · 004 Scene Engine · 005 Episode JSON → Video · 006 DeepSeek · 007 Research + Visual Director · 008 One-command Factory

## Visual design system

`src/themes/vibeTheme.ts` centralizes color, type scale, safe areas, spacing, glow, opacity, line widths, motion, camera, and layer order. Shared background layers, editorial typography, camera moves, and soft spatial transitions live under `src/components/`. Read [docs/VISUAL_LANGUAGE.md](docs/VISUAL_LANGUAGE.md) before adding visual scenes.

## Requirements

Node.js and npm. Install dependencies with `npm install`.

## Development

Run `npm run dev` to open Remotion Studio. It includes `Task001Foundation`, `Task002VisualSystem`, `Task003ComponentGallery`, and `Task004SceneEngine`.

Run `npm run typecheck` to typecheck the project.

Run `npm run render:task001` to render the 1920×1080, 30 FPS, 600-frame composition. The output is `output/task001-foundation.mp4`.

Run `npm run render:task002` to render the 1920×1080, 30 FPS, 900-frame composition. The output is `output/task002-visual-system.mp4`.

Run `npm run render:task003` to render the 1920×1080, 30 FPS, 1350-frame component gallery. The output is `output/task003-component-gallery.mp4`.

Run `npm run render:task004` to render the 1920×1080, 30 FPS, 1800-frame (60-second) scene-engine demo. The output is `output/task004-scene-engine.mp4`.

Read [docs/COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) for the reusable component API, props, examples, and visual rules.
Read [docs/SCENE_ENGINE.md](docs/SCENE_ENGINE.md) for episode configuration, timeline transitions, scene registry, and subtitle behavior.

## JSON episode quick start (Task 005)

Create new videos through `episodes/*.json`. Copy an existing example and change its content, scene order, durations, geometry or numbers. The engine keeps typography, animation and visual style consistent.

```sh
npm install
npm run validate:episodes
npm run test:episodes
npm run typecheck
npm run render:episode -- episodes/braess-paradox.json
npm run render:episode -- episodes/dollar-auction.json
```

Outputs: `output/braess-paradox.mp4` (60 seconds) and `output/dollar-auction.mp4` (47.4 seconds). Both are 1920×1080 at 30 FPS, with no audio. `npm run dev` also includes the generic `EpisodeVideo` composition, using Braess as its preview default. Other JSON inputs are supplied by the render command; duration is calculated automatically.

Validate one file with `npm run validate:episode -- episodes/your-episode.json`. Read [EPISODE_FORMAT.md](docs/EPISODE_FORMAT.md) for the complete format, minimal example, scene vocabulary and restrictions. Regenerate the JSON Schema artifact with `npm run schema:episode`. [TASK_005.md](docs/tasks/TASK_005.md) records implementation and actual verification evidence.

## AI content drafts (Task 006)

DeepSeek generation is an optional, explicit CLI action. Set `DEEPSEEK_API_KEY` in the current shell; never place a real key in a file. `.env.example` documents variable names and is not auto-loaded. The default model is `deepseek-flash`; `deepseek-v4-pro` is optional.

```powershell
$env:DEEPSEEK_API_KEY="your-key"
npm run generate:episode -- --topic "Why can more choices make decisions worse?" --id choice-overload --duration 150 --dry-run
npm run render:episode -- episodes/generated/choice-overload.json
npm run make:episode -- --topic "Why can more choices make decisions worse?" --id choice-overload-auto --duration 150
```

Generation writes a content brief, raw and validated JSON, and a report under `generated/<id>/`; the renderable episode goes under `episodes/generated/<id>.json`. Existing outputs are protected unless `--force` is given. `--brief path.md` adds a user-supplied brief; if `--topic` is also given, the brief supplies context and the topic supplies the requested focus. `--facts path.md` attaches user-provided evidence. Use `--model deepseek-v4-pro` to override `DEEPSEEK_MODEL`. Drafts are not researched or publication-verified; claims that need sources are flagged. See [AI_CONTENT_PIPELINE.md](docs/AI_CONTENT_PIPELINE.md) for the stage and evidence boundary.

## Research and visual planning (Task 007)

Task007 adds opt-in Tavily research, cited Fact Packs, a publication-readiness report, verified draft generation, and concept-specific VisualPlan QA. Set `TAVILY_API_KEY` and `DEEPSEEK_API_KEY` only in your shell; `.env.example` has empty placeholders. Automated tests use research fixtures and do not call Tavily.

```powershell
npm run research:episode -- --topic "Why can more choices make decisions worse?" --id paradox-of-choice --provider tavily --max-sources 20
npm run generate:verified -- --topic "Why can more choices make decisions worse?" --id paradox-of-choice --duration 150
npm run plan:visuals -- --episode episodes/generated/paradox-of-choice.json --facts research/paradox-of-choice/fact-pack.json
```

Research artifacts are written under `research/<id>/`; visual plans and QA reports under `generated/<id>/`. A blocked publication gate still permits draft rendering for visual review. See [RESEARCH_PIPELINE.md](docs/RESEARCH_PIPELINE.md) and [VISUAL_DIRECTOR.md](docs/VISUAL_DIRECTOR.md).

## One-command verified factory (Task 008)

The factory connects the existing brief, research, Fact Pack, verified Episode, VisualPlan, release gates, deterministic Remotion render, and review package. If valid Task007 artifacts already exist for the same topic and ID, it reuses them and does not call Tavily or regenerate the Fact Pack. Rendering reads only saved Episode and VisualPlan data and has no provider/API dependency.

```powershell
npm run factory -- --topic "Why can more choices make decisions worse?" --id paradox-of-choice --duration 150
```

Run `npm run factory -- --help` for options. Use `--resume` to recover checkpoints, `--skip-render` to build the verified package without MP4, `--draft` to package a clearly labelled blocked draft, and `--force` to start over for the given ID. DeepSeek/Tavily keys are needed only for missing pipeline artifacts. Set them in the shell or a local `.env` file (ignored by Git); `.env.example` contains empty placeholders.

The command writes resumable state and logs to `runs/<id>/`, a release package to `deliveries/<id>/`, deterministic QA stills to `qa/<id>/`, and the rendered MP4 to `output/<id>.mp4`. For 120–180 second episodes, the release gate requires a diversity score of at least 50, at least four archetypes, no repeated archetype run longer than two, network scenes at or below 50%, text-dominant scenes at or below 60%, and a signature moment. The automatic visual-plan quality repair is bounded to one attempt. Remotion stills are produced at representative frames for human review; they are not a claim that a model inspected every pixel. See [FACTORY.md](docs/FACTORY.md) and [TASK_008.md](docs/tasks/TASK_008.md).

## Phase 2 — Recraft Visual System

Phase 2 uses **Recraft only** for visual assets and keeps **Remotion as the final
compositor** for typography, charts, formulas, procedural animation, camera motion,
compositing, and MP4 rendering. OpenAI Image, Midjourney, Seedance, and Canva are
outside this architecture. Phase 1 DeepSeek, Tavily, Research, Fact Pack, and Factory
v1 remain unchanged.

Copy `.env.example` to `.env` and configure secrets locally. Run `npm run phase2:preflight` to see provider configuration state without displaying any values;
run `npm run recraft:style-status` to check the profile and lock state. Run
`npm run recraft:validate-style` for a one-image smoke and six-image validation set;
generated assets stay local and ignored by Git. An API response does not by itself
approve the style. See [Phase 2](docs/PHASE2.md), [API notes](docs/RECRAFT_API_NOTES.md),
and [the human review sheet](docs/RECRAFT_STYLE_REVIEW.md).

The active Task001 refinement validates **Midnight Scientific Editorial v2** using six
simple style references and six atomic validation subjects. Run
`npm run recraft:validate-midnight-style` to create one custom style if needed and
generate the validation set; use `npm run recraft:score-midnight-style` after recording
an assessment. A newly created style identifier is immediately saved in the ignored
`.recraft-style.local.json`; `RECRAFT_STYLE_ID` in the environment takes priority. The
identifier is never printed or committed. This refinement does not start Task002.

### Phase 2 Task V2-02 — Asset Strategy

The independent AssetPlan routes each scene to procedural, Recraft, hybrid, or reuse.
Recraft provides illustrated atomic assets; Remotion draws exact information graphics.
Hybrid is preferred when a physical subject and precise knowledge visualization appear
together. Planning is offline by default and never calls Recraft:

```powershell
npm run plan:assets -- --episode episodes/generated/paradox-of-choice.json --visual-plan generated/paradox-of-choice/visual-plan.json --facts research/paradox-of-choice/fact-pack.json --dry-run
```

See [Asset Strategy](docs/ASSET_STRATEGY.md) for routing rules, budgets, and registry
reuse.

### Phase 2 Task V2-03 — Recraft Asset Generation

Task003 executes only the new assets selected by Task002. A dry run is offline; normal
execution validates the budget, checks local cache, and calls the existing Recraft
provider only for cache misses:

```powershell
npm run generate:assets -- --plan generated/paradox-of-choice/asset-plan.json --dry-run
npm run generate:assets -- --plan generated/paradox-of-choice/asset-plan.json
```

See [Recraft Asset Generation](docs/RECRAFT_ASSET_GENERATION.md) for retry, reuse,
high-risk, report, and human-review behavior.

### Phase 2 Task V2-04 — Hybrid Scene Composer

The hybrid composer consumes existing Episode, VisualPlan, AssetPlan, Recraft manifest,
and local asset-review state, then combines approved local illustrations with Remotion
information layers into an MP4. Pending assets fall back by default; `--allow-pending-assets`
creates a visibly marked draft and never bypasses rejection. Start with
`npm run review:asset -- --episode <id> --asset <id> --approve|--reject|--pending`, then
run `npm run render:hybrid -- --episode <path> --visual-plan <path> --asset-plan <path> --manifest <path>`.
It does not rerun research or image generation. See
[Hybrid Scene Composer](docs/HYBRID_COMPOSER.md).
