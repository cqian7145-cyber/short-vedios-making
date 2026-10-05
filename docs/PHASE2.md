# Phase 2 — Recraft Visual System

Phase 2 uses Recraft as the only external visual generation provider and Remotion as
the final compositor and renderer. Recraft primarily creates atomic illustrations,
icons, objects, and characters. Remotion owns scene layout, typography, charts,
formulas, procedural
animation, camera motion, compositing, and final MP4 rendering.

OpenAI Image, Midjourney, Seedance, and Canva are outside this architecture. DeepSeek,
Tavily, Research, Fact Pack, and Factory v1 remain Phase 1 services and do not depend
on Recraft.

## Selected profile

Phase 2 v1 validates the original custom profile `Midnight Scientific Editorial v1`
(`midnight-scientific-editorial-v1`). The earlier public style remains a rejected
historical attempt (41/100) and is not the production profile. Style identifiers are
runtime-only and are never stored in tracked source, reports, manifests, or logs.
`RECRAFT_STYLE_ID` is the local runtime setting for generation after the new style is
available.

Phase 1 keeps its dark academic/editorial world: near-black or dark navy background,
ivory typography, restrained gold highlights, technical diagrams, negative space,
and slow cinematic motion. Recraft supplies visual subjects. Remotion adds information
and motion around those subjects.

## Commands

- `npm run phase2:preflight` — configuration state only; no secrets are printed.
- `npm run recraft:style-status` — selected profile and locked/missing status.
- `npm run recraft:validate-midnight-style` — rasterizes six original reference SVGs,
  creates a private V3 custom style from them when no Style ID is configured, and
  generates six atomic validation images. The ID stays in process memory. Use
  `--force` only when intentionally replacing generated paid outputs.
- `npm run recraft:score-midnight-style` — scores a completed local assessment using
  the explicit semantic-failure and human-approval lock gates.
- `npm run recraft:validate-style` — the earlier public-style validation record.

Generated validation images are local and ignored by Git. The manifest and style
report do not contain credentials or the style identifier. A generated image set
remains `needs-review` until the assets are checked against the human review sheet.
An API response alone never locks a style.

The new style creation uses Recraft's documented `POST /v1/styles` multipart flow,
with six PNG references, `model=recraftv3`, the documented `digital_illustration`
base, and `match=regular`. The same `recraftv3` model is used for validation images.
Because `.env` is intentionally not modified in this task, an API-created style ID
is used only in memory in that single validation run; it is omitted from every file
and console message. The user must later save the new ID locally before routine reuse.

## V2 roadmap

- V2-01 — Recraft style lock and validation (current Task001).
- V2-02 — episode asset strategy and controlled asset generation.
- V2-03 — asset normalization and compositing.
- V2-04 — Remotion hybrid scenes.
- V2-05 — visual quality and similarity checks.
- V2-06 — cross-episode asset reuse.
- V2-07 — Factory v2.

## Official API references

- [Recraft generation endpoints](https://www.recraft.ai/docs/api-reference/endpoints)
- [Image inputs and results](https://www.recraft.ai/docs/api-reference/image-inputs-and-results)
- [Recraft V4 Styles](https://www.recraft.ai/docs/api-reference/models/recraft-v4-styles)
- [Style matching](https://www.recraft.ai/docs/api-reference/styles)
- Detailed implementation notes: [RECRAFT_API_NOTES.md](RECRAFT_API_NOTES.md).
