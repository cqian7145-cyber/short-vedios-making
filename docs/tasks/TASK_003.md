# Task 003 — Reusable Animation Component Library

## Goal

Create a small, typed library of deterministic visual primitives that future knowledge scenes can compose rather than reimplementing for each episode.

## Architecture

- `src/utils/timing.ts` provides shared clamped frame progress, draw progress, and fade progress.
- `src/utils/random.ts` provides seeded deterministic helpers for repeatable visual variation.
- `src/components/diagram/` holds nodes, edges, arrows, path flow, relationships, and focus rings.
- `src/components/data/` holds a measured counter and restrained line chart.
- `src/components/knowledge/` holds timelines, formulas, and probability primitives.
- `src/components/entities/` holds abstract agents and a top-down vehicle token.
- `src/components/annotation/` holds short labels and leader-line callouts.
- `src/components/index.ts` exports the public API. Legacy `GlowPath` remains as a compatible wrapper for Task 001/002 scenes.
- `Task003ComponentGallery` composes the public primitives into five overlapping cinematic chapters without changing either earlier composition's ID or duration.

## Components

`Node`, `AnimatedEdge`/`Edge`/`GlowPath`, `Arrow`, `FlowParticles`, `Counter`, `Timeline`, `Formula`, `MiniChart`, `ProbabilityBar`, `AgentToken`, `VehicleToken`, `Relationship`, `Callout`, `Label`, and `HighlightRing`.

See [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) for purpose, props, examples, visual rules, good use cases, and anti-patterns.

## Acceptance Criteria

- [x] Task 001 and Task 002 remain registered and render successfully.
- [x] `Task003ComponentGallery` is registered at 1920×1080, 30 FPS, 1350 frames / 45 seconds.
- [x] All listed reusable primitives have explicit TypeScript props and theme-aware defaults.
- [x] Animation timing is frame-based and shares `startFrame` / `duration` conventions where applicable.
- [x] Flow particles are deterministic for a given seed and frame; no unseeded randomness or wall-clock animation is used.
- [x] Gallery stages network, data, time/knowledge, agents/relationships, a combined experiment, and a quiet branded exit.
- [x] The Gallery is cinematic and continuous rather than a component-docs or dashboard layout.
- [x] `docs/COMPONENT_LIBRARY.md` and this task record are complete.
- [x] `npm install`, `npm run typecheck`, and all three render scripts succeed.
- [x] Task 003 output metadata is 1920×1080, 30 FPS, 45 seconds, with no audio.
- [x] Frames 150, 390, 650, 900, and 1150 are visually reviewed and temporary stills are removed.
- [ ] The requested feature commit is pushed to `origin/main`.

## Evidence

Validation evidence:

- `npm install` — succeeded; dependencies are up to date, with zero reported vulnerabilities. npm noted the optional `esbuild` postinstall script was not approved; Studio bundling and all renders succeeded.
- `npm run typecheck` — succeeded (`tsc --noEmit`).
- `npm run dev` — Studio was already available at `http://localhost:3000`; `npx remotion compositions src/index.ts` listed all three compositions at the expected dimensions, frame rates, and durations.
- `npm run render:task001` — succeeded; 600 frames rendered to `output/task001-foundation.mp4`.
- `npm run render:task002` — succeeded; 900 frames rendered to `output/task002-visual-system.mp4`.
- `npm run render:task003` — succeeded; 1350 frames rendered to `output/task003-component-gallery.mp4` (about 4.7 MB).
- `@remotion/renderer.getVideoMetadata` — Task 001: 1920×1080, 30 fps, 20 seconds, H.264, no audio; Task 002: 1920×1080, 30 fps, 30 seconds, H.264, no audio; Task 003: 1920×1080, 30 fps, 45 seconds, H.264, no audio. `ffprobe` is not installed in this environment.
- Still frames 150, 390, 650, 900, and 1150 were reviewed. The network, data, timeline/formula, agent/relationship, and combined-system scenes share the same palette and hierarchy; the formula/callout overlap found on the first review was corrected and frame 650 was reviewed again.
- Two independent still renders of Task 003 frame 150 had the same SHA-256: `6166A280DFD64F9D6B14D2760A393F750315596107CEBC325BBF448711FF8241`.
- A source scan found no uses of `Math.random`, `Date.now`, `setTimeout`, `setInterval`, `fetch`, audio components, or service integrations under `src/components`, `src/scenes`, `src/compositions`, or `src/utils`.
- Temporary review stills were removed. Rendered MP4s remain local under ignored `output/` and are excluded from Git.

Git commit and push result will be recorded after delivery.
