# Phase 2 — Recraft Visual System

Phase 2 uses Recraft as the only external visual generation provider and Remotion as
the final compositor and renderer. Recraft creates illustrations, icons, objects,
characters, and scene plates. Remotion owns typography, charts, formulas, procedural
animation, camera motion, compositing, and final MP4 rendering.

OpenAI Image, Midjourney, Seedance, and Canva are outside this architecture. DeepSeek,
Tavily, Research, Fact Pack, and Factory v1 remain Phase 1 services and do not depend
on Recraft.

## Selected profile

Phase 2 v1 uses the user-selected Recraft style and the non-secret profile
`Selected Editorial Scientific Style` (`recraft-v1`). The style identifier is read
only from `RECRAFT_STYLE_ID` at runtime. It is never stored in tracked files, output
metadata, or logs.

Phase 1 keeps its dark academic/editorial world: near-black or dark navy background,
ivory typography, restrained gold highlights, technical diagrams, negative space,
and slow cinematic motion. Recraft supplies visual subjects. Remotion adds information
and motion around those subjects.

## Commands

- `npm run phase2:preflight` — configuration state only; no secrets are printed.
- `npm run recraft:style-status` — selected profile and locked/missing status.
- `npm run recraft:validate-style` — one smoke image, then six cross-category images
  when both Recraft settings are present. Use `--force` only when intentionally
  replacing existing paid outputs.

Generated validation images are local and ignored by Git. The manifest and style
report do not contain credentials or the style identifier. A generated image set
remains `needs-review` until the assets are checked against the human review sheet.
An API response alone never locks a style.

## V2 roadmap

- V2-01 — locked-style provider foundation and validation.
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
