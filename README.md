# Vibe Knowledge Video Engine

A deterministic, Remotion-based visual engine for cinematic English-language knowledge videos. Task 001 establishes the foundation, Task 002 defines the shared visual design system, and Task 003 adds reusable frame-driven animation primitives. The project uses original abstract diagrams and currently contains no narration, music, external API calls, or API keys.

## Task roadmap

001 Foundation · 002 Visual Design System · 003 Animation Components · 004 Scene Engine · 005 Episode JSON → Video · 006 DeepSeek · 007 Research + Visual Director · 008 One-command Factory

## Visual design system

`src/themes/vibeTheme.ts` centralizes color, type scale, safe areas, spacing, glow, opacity, line widths, motion, camera, and layer order. Shared background layers, editorial typography, camera moves, and soft spatial transitions live under `src/components/`. Read [docs/VISUAL_LANGUAGE.md](docs/VISUAL_LANGUAGE.md) before adding visual scenes.

## Requirements

Node.js and npm. Install dependencies with `npm install`.

## Development

Run `npm run dev` to open Remotion Studio. It includes `Task001Foundation`, `Task002VisualSystem`, and `Task003ComponentGallery`.

Run `npm run typecheck` to typecheck the project.

Run `npm run render:task001` to render the 1920×1080, 30 FPS, 600-frame composition. The output is `output/task001-foundation.mp4`.

Run `npm run render:task002` to render the 1920×1080, 30 FPS, 900-frame composition. The output is `output/task002-visual-system.mp4`.

Run `npm run render:task003` to render the 1920×1080, 30 FPS, 1350-frame component gallery. The output is `output/task003-component-gallery.mp4`.

Read [docs/COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) for the reusable component API, props, examples, and visual rules.
