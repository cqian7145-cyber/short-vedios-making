# Episode JSON format (schemaVersion 1)

JSON controls meaning. The engine controls style. Create an episode by copying a file under `episodes/`, editing its content, and running validation and rendering. No React change is needed for stories expressed with the existing scene vocabulary.

## Minimal complete episode

```json
{
  "schemaVersion": 1,
  "id": "a-small-question",
  "title": "A Small Question",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "metadata": {"language": "en", "topic": "Choices"},
  "networks": {},
  "scenes": [
    {
      "id": "question",
      "type": "hook",
      "durationSeconds": 6,
      "subtitle": "Two choices can change one system.",
      "intent": {"camera": "slowPushIn"},
      "content": {
        "eyebrow": "A SMALL QUESTION",
        "headline": "More choices.\nBetter outcomes?",
        "emphasis": "Better outcomes?",
        "question": "WATCH THE SYSTEM",
        "participants": ["CHOICE A", "CHOICE B"],
        "relationshipLabel": "ONE SYSTEM"
      }
    },
    {
      "id": "close",
      "type": "ending",
      "durationSeconds": 4,
      "transition": {"overlapSeconds": 1.1, "direction": "left"},
      "content": {
        "concept": "CHOICES AND SYSTEMS",
        "summary": "Look beyond the individual choice.",
        "brand": "VIBE KNOWLEDGE"
      }
    }
  ]
}
```

This produces 267 frames (8.9 seconds). All text is rendered as plain React text. Use English copy. JSON cannot set CSS, font sizes, glow, arbitrary HTML, JSX, JavaScript, file paths, or remote assets.

## Top-level fields

| Field | Contract |
| --- | --- |
| schemaVersion | Exactly 1; unsupported versions fail explicitly |
| id | Stable alphanumeric ID, with hyphens or underscores |
| title | Nonempty editorial title |
| fps / width / height | Exactly 30 / 1920 / 1080 |
| metadata | Optional topic, language (`en`), category |
| scenes | Nonempty ordered array; unique scene IDs |
| networks | Map of reusable network geometry, or `{}`; map key equals network ID |

`src/episode/schema.ts` is the runtime contract and TypeScript type source. `docs/episode.schema.json` is generated from it using `npm run schema:episode`. The generated artifact covers structure; the runtime validator also checks references and timeline semantics.

## Scene types and content

Each scene requires `id`, `type`, `durationSeconds`, and `content`. Optional fields are `transition`, `subtitle`, and `intent`. Unknown fields are rejected at every object level.

| Type | Required content | Optional content |
| --- | --- | --- |
| hook | eyebrow, headline, emphasis, question | networkId, participants (two labels), relationshipLabel |
| setup | eyebrow, title | networkId, routeLabel, destinationLabel, participants, relationshipLabel |
| history | eyebrow, year, name, mark, formula, formulaAnnotation | — |
| diagram | networkId, eyebrow, title, footnote, annotations | highlightNodeId, highlightEdgeId |
| simulation | mode, plus the mode-specific fields below | — |
| comparison | eyebrow, metricLabel, before, after, unit, beforeLabel, afterLabel | networkId, prefix, decimals (0–6) |
| reveal | eyebrow, headline, emphasis | networkId, highlightNodeId, highlightEdgeId, participants, relationshipLabel |
| explanation | individualLabel, individualStatement, systemLabel, systemStatement, principle, bottleneckLabel, driverLabels (two labels), sharedLinkLabel | networkId, focusNodeId |
| ending | concept, summary, brand | networkId |

Diagram annotations contain `label`, optional `detail`, and `anchorNodeId`. Headline emphasis identifies the part of the headline shown in gold. Text lengths should remain short enough for the shared typography; schema validity does not replace visual review.

### Simulation modes

`networkFlow`: `networkId`, `eyebrow`, `metricLabel`, `beforeCaption`, `afterCaption`, `from`, `to`, `unit`, `baselineRouteCounts`, `redistributedRouteCounts`, `addedEdgeId`, `newRouteId`, `bottleneckLabel`. Route-count objects map route IDs to integer particle counts (0–200). Counts describe visual density, not a traffic solver.

`bidding`: `eyebrow`, `metricLabel`, two `participants` (`id`, `label`, optional semantic `accent`), ordered `bids` (`bidderId`, `amount`), `prizeValue`, `currencyPrefix`, `relationshipLabel`, `exceedsLabel`. Bid events are distributed across the simulation duration. Agents alternate active state according to the data; flow density increases and the relationship turns muted red above the prize value. Amounts are displayed to two decimals. This is a reusable event visualization, not an economic equilibrium solver.

See the complete [Braess](../episodes/braess-paradox.json) and [Dollar Auction](../episodes/dollar-auction.json) examples.

## Duration and transitions

All authored times are seconds. Normalization uses `Math.round(seconds * fps)` for scene duration and explicit overlap. Durations must round to at least one frame. The incoming overlap must be shorter than both adjacent scenes. Omitted overlap uses the Scene Engine default, 34 frames; the first scene has no incoming overlap. Total duration is the sum of scene frames minus incoming overlaps. There is no 60-second limit; 120–180 second episodes use the same pipeline.

`transition.direction` is `left` or `right`. The engine owns easing and transition distance. `calculateMetadata` sets the generic composition's duration from the normalized timeline, so changing JSON timing needs no Root edit.

## Networks

Each network has `id`, `nodes`, `edges`, `routes`, optional `addedEdgeId`, and optional `bottleneck` (`x`, `y`, optional `nodeId`). Nodes have unique `id`, `label`, `x`, `y`; coordinates use the 1920×1080 canvas. Edges have unique `id`, `from`, `to`, optional SVG `path`, `label`, and `role` (`base` or `added`). Routes have unique `id`, `label`, SVG `path`, and optional semantic `accent`.

SVG paths accept geometry commands and numbers only. They are not asset references. An edge without a path uses a straight line between its nodes. All referenced network, node, edge and route IDs must exist. Geometry, text and counts are internal structured data; no URL downloading or JSON-directed file reads occur.

## Subtitles and visual intent

`subtitle` is optional English lower-third copy; the engine controls its safe area and fade envelope. `intent.camera` supports `slowPushIn`, `slowPullBack`, `driftLeft`, `driftRight`, and `parallax`. Semantic accents are `gold`, `red`, and `cyan`; density is `sparse`, `balanced`, or `dense`. `intent.focus` is an editorial description retained from Task004. Explicit `highlightNodeId`, `highlightEdgeId`, and `focusNodeId` choose diagram targets. The current engine applies camera intent; scene primitives own their accent and density behavior. Participant accents and route accents are applied directly. Intent metadata does not inject CSS.

## Validation and rendering

```sh
npm install
npm run validate:episode -- episodes/braess-paradox.json
npm run validate:episodes
npm run test:episodes
npm run typecheck
npm run render:episode -- episodes/braess-paradox.json
npm run render:episode -- episodes/dollar-auction.json
```

Validation reads and parses JSON once on Node, checks structure and semantics, and normalizes the timeline. Failures print filename, field path, expected constraint and received value where applicable, then exit nonzero before bundling. Rendering supplies normalized props to `EpisodeVideo` through the official Remotion bundler/renderer APIs. React frame rendering performs no filesystem reads.

Output filenames use the input file basename: `episodes/name.json` → `output/name.mp4`. Outputs are silent H.264 MP4s and ignored by Git. `npm run dev` previews the Braess example through `EpisodeVideo` default props, alongside Task001–004. To author another episode, copy either example, edit the JSON, validate, render, and review the output.
