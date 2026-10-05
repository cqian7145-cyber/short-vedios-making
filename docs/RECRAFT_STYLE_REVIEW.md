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

## Midnight Scientific Editorial v1 — Task001 follow-up

Review the six atomic outputs in
`assets/style-validation/midnight-scientific-editorial-v1/` at full size and at typical
video display size. A semantic mismatch (especially a scale instead of an auction
paddle, or a tree instead of a two-way choice symbol) is a critical failure.

- [ ] Person remains a simple, readable character
- [ ] Steam locomotive is recognizable and fully framed
- [ ] Auction paddle is visibly a bidding paddle, not a scale
- [ ] Single door reads clearly without a full corridor scene
- [ ] Car silhouette is recognizable
- [ ] Choice icon has one start, two branches, and two endpoints
- [ ] Six outputs share the same palette, line treatment, and detail density
- [ ] Every subject has clear edges and contrast on near-black/navy
- [ ] Outputs are isolated and usable as Remotion layers
- [ ] No unwanted embedded words, numbers, or logos

| Asset | Semantic accuracy | Silhouette/edge | Dark fit | Style consistency | Critical failure |
| --- | --- | --- | --- | --- | --- |
| Person | | | | | |
| Steam engine | | | | | |
| Auction paddle | | | | | |
| Door | | | | | |
| Car | | | | | |
| Branching symbol | | | | | |

The new editorial rubric is style consistency /20, semantic accuracy /20, object
clarity /15, character consistency /10, icon readability /10, dark-background fit /10,
and Remotion compatibility /15. A critical semantic failure always blocks locking.
Human approval remains required even at 80 or above.

If API creation is complete but the new Style ID is not configured locally, save that
new ID to the ignored `.env` as `RECRAFT_STYLE_ID=...` before routine future
generation. The validation command does not update `.env`.

**HUMAN APPROVAL REQUIRED.**

### Automated validation result (2026-10-05)

Six outputs were generated with the new private style. Editorial heuristic: **63/100
(rejected)**. Semantic accuracy was **12/20**; critical failures: auction paddle and
branching-choice symbol. The auction object resembles a round racket/magnifying-glass
form; the choice icon includes leaf-like tree marks. Person, locomotive, door, and car
were recognizable. Style lock remains false, and human approval remains pending.
