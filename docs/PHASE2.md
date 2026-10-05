# Phase 2 — Recraft Visual System

Phase 2 adds a reusable illustration identity for the Vibe Knowledge Video Engine.
Recraft is the sole external visual generation provider. Remotion remains the final
compositor and owns typography, data visualization, charts, formulas, animation,
camera movement, compositing, and MP4 rendering.

The division of work is fixed:

- **Recraft:** illustrations, objects, icons, and scene plates.
- **Remotion:** type, charts, procedural motion, camera movement, and final video.

OpenAI Image, Midjourney, Seedance, and Canva are outside the current Phase 2
architecture. DeepSeek, Tavily, Research, Fact Pack, and Factory v1 remain unchanged.

## Phase 2 roadmap

- **V2-01 — Recraft visual identity:** style bible, local reference studies,
  configuration status, and eventual custom style lock.
- **V2-02 — Asset generation:** controlled Recraft API asset generation.
- **V2-03 — Asset normalization:** prepare assets for predictable compositing.
- **V2-04 — Remotion scene integration:** combine generated assets with procedural
  visualizations and motion.
- **V2-05 — Visual quality checks:** validate readability and asset suitability.
- **V2-06 — Episode asset mapping:** connect approved assets to episode scenes.
- **V2-07 — Factory v2:** orchestrate the verified asset-to-video pipeline.

## Configuration

Copy `.env.example` to `.env` and fill values locally. The tracked template contains
only empty secret placeholders. `npm run phase2:preflight` reports only whether each
provider and style is configured; it never prints credentials or a style ID.
`npm run recraft:style-status` reports the non-secret profile name/version and whether
the style is locked.

Recraft remains unlocked until candidate outputs have passed cross-object evaluation
and the resulting real style ID is supplied locally. No style ID is stored in tracked
source or documentation.

## Official Recraft references

- [API endpoints](https://www.recraft.ai/docs/api-reference/endpoints)
- [Custom styles](https://www.recraft.ai/docs/api-reference/styles)
- [Recraft V4 Styles](https://www.recraft.ai/docs/api-reference/models/recraft-v4-styles)

The current official style documentation describes custom styles created from
reference images and use through a style ID/style reference. API usage for V2-02 is
intentionally outside this task.
