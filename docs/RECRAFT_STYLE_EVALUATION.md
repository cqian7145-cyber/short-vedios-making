# Recraft Style Evaluation — recraft-v1

## Evaluation status

This is a **provisional design-direction review**, not an evaluation of Recraft
generated outputs. Local credentials currently report the Recraft API as missing, so
no Recraft generation was made and no consistency claim is made across generated
subjects. Candidate C is recommended for a controlled first Recraft evaluation, but
the style remains **unlocked** until actual outputs pass the cross-object review.

## Candidate comparison

Scores below assess the written visual directions against the channel brief only;
they are hypotheses for selecting what to test first, not evidence that automation
already reproduces the style.

| Criterion | A: TECH BLUE LINE | B: SATURATED FLAT | C: HYBRID BLUE EDITORIAL |
| --- | ---: | ---: | ---: |
| Style consistency /20 | 17 | 16 | 18 |
| Knowledge-video fit /20 | 17 | 16 | 18 |
| Readability /15 | 12 | 15 | 14 |
| Negative-space quality /15 | 14 | 13 | 13 |
| Object clarity /10 | 7 | 9 | 9 |
| Human consistency /10 | 7 | 7 | 8 |
| Animation compatibility /10 | 9 | 8 | 9 |
| **Provisional total /100** | **83** | **84** | **89** |

These scores do not unlock a style ID. The >=80 lock threshold must be met using
reviewed Recraft generations, including repeated subjects and different object
classes.

## Required validation set before lock

Generate multiple examples under the same candidate style for: door, steam engine,
person, coin, factory, car, auction paddle, brain, book, and map object. Review line
weight, blue palette, silhouette clarity, negative space, text leakage, and suitability
for compositing. Include at least the following reference categories in the eventual
small source set: technical machine, branching-choice concept, abstract person,
corridor/factory environment, and isolated coin/clock object.

**Current reference set:** design categories and prompts are documented above; no
Recraft output references exist yet. No genuine Recraft reference image is claimed.

## Lock record

- Candidate to test first: **C — HYBRID BLUE EDITORIAL**.
- Evaluation: **89/100 provisional direction score; Recraft output score pending**.
- Style lock: **No**.
- Style ID: intentionally absent from tracked files. Set `RECRAFT_STYLE_ID` in local
  `.env` only after the actual output review passes.
