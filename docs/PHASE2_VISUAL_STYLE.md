# Recraft Visual Style Bible — recraft-v1

## Identity

**Tech Blue Editorial** combines technical blue, minimal linework, and saturated flat
shapes. It should read as scientific editorial illustration: clear, geometric,
high-contrast, clean, and designed to explain an idea. It is not a cyberpunk look,
photorealism, 3D rendering, cute cartooning, or generic SaaS art.

The channel retains its Phase 1 dark academic base: black/deep navy backgrounds,
ivory typography, and restrained gold highlights. Recraft assets form a second visual
layer: blue editorial illustrations sit within that darker world. They should be
composed with clean edges and enough separation for Remotion to place them over the
background.

## Visual rules

| Element | Direction | Avoid |
| --- | --- | --- |
| Color | Electric blue, deep cobalt, cyan accent, clean white; small warm yellow or warning red only for meaning | Rainbow palettes, purple-pink cyberpunk gradients, muddy pastels |
| Shape | Geometric forms, simple silhouettes, large readable masses, limited internal detail | Fussy ornament, ambiguous silhouettes |
| Line | Minimal technical contours with a consistent stroke impression | Sketchy pencil, hand-drawn wobble, inconsistent outlines |
| Light | Mostly flat; small controlled highlights and rare subtle glow | Photoreal cinematic light, heavy volumetric beams, lens flare |
| Material | Flat vector/editorial feel | Chrome, glassmorphism, plastic 3D, Pixar-like rendering |
| People | Simplified abstract figures with no facial detail | Realistic faces, celebrity likeness, anime, cute mascots |
| Objects | Recognizable, geometric, diagram-friendly forms | Tiny detail that fails at video scale |
| Composition | One dominant subject, strong focal hierarchy, large negative space, reserved room for Remotion type | Busy posters, full-frame clutter, tiny decoration |

## Compositing contract

Prefer isolated subjects, crisp edges, clean silhouettes, sparse texture, and a
transparent or visually quiet background when supported by the approved generation
workflow. Avoid hair-like detail, photographic blur, and busy scenery. Remotion owns
all typography and data labels. Generated illustrations must contain **no text**.

## Candidate directions

1. **A — TECH BLUE LINE:** thin technical outlines, geometric construction, restrained
   fills. Most diagram-like; risk is becoming too schematic or low-mass.
2. **B — SATURATED FLAT:** large blue color blocks with minimal contours. Most readable
   at a glance; risk is losing the technical/editorial signature.
3. **C — HYBRID BLUE EDITORIAL:** minimal technical outlines over saturated flat blue
   forms. Recommended starting direction because it balances subject clarity with a
   repeatable line signature. It remains provisional pending Recraft output review.

The canonical shared constraint is in [recraft-style-v1.md](../prompts/recraft-style-v1.md).
The profile fingerprint is in `src/visual/recraftStyleProfile.ts`; it intentionally
contains no API key or style ID.
