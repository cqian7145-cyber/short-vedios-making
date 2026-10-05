# Recraft Style Review — recraft-v1

Review the six files in `assets/style-validation/recraft-v1/` against the selected
profile and the existing dark editorial world. Check at full view and at typical video
display size.

- [ ] Character feels consistent
- [ ] Steam engine is readable
- [ ] Auction objects are readable
- [ ] Door corridor fits knowledge-video composition
- [ ] Factory matches the same style
- [ ] Icon remains readable when small
- [ ] Assets fit dark backgrounds
- [ ] No obvious style drift
- [ ] No unwanted generated text
- [ ] Suitable for Remotion animation

## Per-asset notes

| Asset | Silhouette/edge | Contrast on dark | Negative space | Style drift/text | Remotion fit | Warning |
| --- | --- | --- | --- | --- | --- | --- |
| Character | | | | | | |
| Steam engine | | | | | | |
| Auction objects | | | | | | |
| Door corridor | | | | | | |
| Factory | | | | | | |
| Choice icon | | | | | | |

## Score

Use the editorial heuristic in the generated report: style consistency /25, object
clarity /15, character consistency /10, scene compatibility /10, icon readability /10,
dark-background fit /15, and Remotion compatibility /15. Scores require actual image
inspection; no API success or hard-coded value counts as evidence.

**HUMAN APPROVAL REQUIRED.** A score of at least 80 is necessary but does not replace
the human review above. Record the final approval separately; do not put the style ID
in this document.

## Initial image review (2026-10-05)

The six generated outputs were visually inspected at full-frame size. The editorial
heuristic score was **41/100 (rejected)**: consistency 12/25, object clarity 6/15,
character consistency 6/10, scene compatibility 6/10, icon readability 2/10,
dark-background fit 4/15, and Remotion compatibility 5/15. Human approval remains
pending; style lock is false.

Observed issues: the character/corridor/steam outputs are cinematic and textured while
the factory is flat-vector; the requested auction paddle and coin became a balance
scale; the branching-choice icon became a full-frame tree-and-scales scene; most assets
have pale or busy full-frame backgrounds; the smoke engine is cropped. No obvious
embedded words or labels were visible. Details are recorded in the local assessment and
report JSON.
