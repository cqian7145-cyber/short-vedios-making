# Task 002 — Visual Design System

## Goal

Define one reusable visual language for historical, systems, and scientific knowledge videos while preserving Task 001 and its composition.

## Visual Direction

Near-black/deep navy atmosphere, warm ivory typography, restrained gold signals, rare muted red/cyan, broad negative space, subtle deterministic texture, measured camera motion, and diagram-led storytelling. The demo moves continuously through an archival year, a running network experiment, and an abstract interference field. It uses no source creator assets.

## Implementation

- Expand `vibeTheme` into tokens for colors, typography, spacing, safe area, glow, opacity, line widths, radii, motion, camera, and z-index.
- Add editorial type variants, composable gradient/particle/texture backgrounds, camera motion presets, and atmospheric, focus, and spatial transitions.
- Upgrade `Subtitle` for a two-line lower third with optional phrase highlight and dark/busy diagram treatments.
- Add `Task002VisualSystem` (1920×1080, 30 fps, 900 frames) and keep `Task001Foundation` unchanged in the Remotion root.
- Document the visual language and add `npm run render:task002`.

## Acceptance Criteria

- [x] `Task001Foundation` still loads and renders.
- [x] `Task002VisualSystem` appears in Remotion Studio at 1920×1080, 30 fps, 900 frames / 30 seconds.
- [x] No API, DeepSeek, audio, TTS, narration, or music pipeline.
- [x] Theme contains the requested design-token groups.
- [x] Type hierarchy, background layers, film texture, deterministic atmosphere, shared camera motion, and at least two natural transitions are implemented.
- [x] Subtitle is a restrained lower third, max two lines, with optional phrase emphasis.
- [x] Historical, system/simulation, and scientific/abstract chapters share one visual language.
- [x] Frames 150, 450, and 750 are reviewed for shared identity, hierarchy, negative space, restrained color, and documentary/cinematic feel.
- [x] `docs/VISUAL_LANGUAGE.md` and this task record are complete.
- [x] `npm install`, `npm run typecheck`, `npm run render:task001`, and `npm run render:task002` succeed.
- [x] `output/task002-visual-system.mp4` exists with 1920×1080, 30 fps, 30 seconds, and no audio.
- [ ] Changes are committed to the requested message and pushed to `origin/main`.

## Evidence

Commands and results:

- `npm install` — succeeded; dependencies were up to date and npm reported zero vulnerabilities.
- `npm run typecheck` — succeeded (`tsc --noEmit`).
- `npm run dev` — Remotion Studio started successfully; the current entry point exposes both compositions.
- `npx remotion compositions src/index.ts` — listed `Task001Foundation` at 1920×1080, 30 fps, 600 frames / 20 seconds and `Task002VisualSystem` at 1920×1080, 30 fps, 900 frames / 30 seconds.
- `npm run render:task001` — succeeded; rendered 600 frames to `output/task001-foundation.mp4`.
- `npm run render:task002` — succeeded; rendered 900 frames to `output/task002-visual-system.mp4` (about 5.6 MB).
- `@remotion/renderer.getVideoMetadata` — Task 001: 1920×1080, 30 fps, 20 seconds, H.264, no audio; Task 002: 1920×1080, 30 fps, 30 seconds, H.264, no audio.
- Still frames 150, 450, and 750 were rendered and visually reviewed. All three chapters share the same dark academic palette and restrained gold; the history and science scenes retain broad negative space, and the simulation's pre-existing network paths remain legible beneath the added route.
- A source scan found no runtime uses of `Math.random`, `Date.now`, `setTimeout`, or `setInterval`, and no audio or API integration in this task.
- Temporary review stills were kept under ignored `output/` during review and removed before commit.

Git commit SHA and push result will be recorded after the requested commit and push.
