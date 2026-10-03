# Task 004 — Scene Engine

## Goal

Create a typed, reusable scene engine and a 60-second English visual demo about why adding a road can worsen traffic. Keep the visual system cinematic and diagram-led while preserving the work from Tasks 001–003.

## Requirements

- 1920×1080, 30 FPS, 1800 frames.
- Nine typed scene types: hook, setup, history, diagram, simulation, comparison, reveal, explanation, ending.
- Episode configuration stored as TypeScript data; share the same road network across scenes.
- Deterministic, frame-driven animations and overlapping scene transitions.
- Shared background/camera shell and optional English lower-third subtitles.
- No voice-over, TTS, music, API key, LLM, search, generated imagery, database, or YouTube API.
- Studio preview and `npm run render:task004` output.

## Implementation

Scene types and duration arithmetic are in `src/engine/sceneTypes.ts` and `src/engine/timeline.ts`. Timeline rendering and transitions are in `SceneTimeline.tsx` and `SceneRenderer.tsx`; the typed renderer map is `sceneRegistry.tsx`. The episode and original road network are configured in `src/data/task004Demo.ts`. The composition is `src/compositions/Task004SceneEngine.tsx`, registered in `src/Root.tsx`.

The story moves from a two-route network to an added shortcut. Deterministic route particles redistribute around the new link and bottleneck as the displayed average trip time changes from 65 to 80 minutes. These values are demo narrative parameters, not a claim about a measured real-world road system. The historical reference is Braess's 1968 paper, *Über ein Paradoxon aus der Verkehrsplanung* ([original paper scan](https://supernet.isenberg.umass.edu/braess/paradox-original.pdf)).

## Acceptance Criteria

- [x] A registered nine-scene typed timeline and episode data.
- [x] Shared continuous network geometry, frame-driven transitions, subtitles, and cinematic shell.
- [x] Task004 composition configured for 1920×1080, 30 FPS, 1800 frames.
- [x] No external services or audio generation.
- [x] `npm install` succeeds.
- [x] `npm run typecheck` succeeds.
- [x] Remotion Studio is running and lists Task004SceneEngine.
- [x] Task 001–004 compositions render successfully.
- [x] Task004 output and requested visual review frames verified.
- [ ] Git diff checked, commit created, and push to `origin/main` confirmed.

## Evidence

### Validation

- `npm install` — passed; 258 packages audited, zero vulnerabilities.
- `npm run typecheck` — passed (`tsc --noEmit`).
- `npm run dev` — Remotion Studio was already running at `http://localhost:3000`; command opened the browser. `npx remotion compositions src/index.ts` listed all four compositions and reported Task004SceneEngine as 1920×1080, 30 FPS, 1800 frames (60 seconds).
- `npm run render:task001`, `npm run render:task002`, `npm run render:task003`, and `npm run render:task004` — all passed. Outputs: 1.6 MB, 5.6 MB, 4.7 MB, and 7.2 MB respectively. Task 004 renders to `output/task004-scene-engine.mp4`.
- Rendered and inspected Task004 stills at frames 120, 300, 540, 900, 1230, 1500, and 1710. They show the hook, shared route network, history transition, new link simulation, comparison, reveal, and ending.
- Rendered frame 900 twice; PNG SHA-256 hashes matched (`5BFC471479C977DC715EF6FE0C656613F1BC5DB36C79799F715BB171864AB51D`), confirming deterministic output at the sampled frame.
- Searched scene/source code for `Math.random`, wall-clock/timer APIs, external API markers, and audio-generation components. No unseeded randomness, timers, API integration, TTS, music, or voice-over implementation was found.
- `ffprobe` is not installed in this environment, so container metadata inspection was unavailable. Composition dimensions, FPS, duration, and successful full-frame render were verified through Remotion.
- `git diff --check` — passed. Generated MP4s and review images are ignored under `output/` and will not be committed.

### Git

Commit and push status will be recorded after they complete.
