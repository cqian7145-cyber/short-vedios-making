# Vibe Knowledge — Component Library

The components in `src/components/` are small frame-driven primitives for building knowledge scenes. They render marks and measurements inside a shared cinematic world; they are not UI controls. Defaults come from `vibeTheme`, while the listed props allow scene-specific geometry and restrained accent overrides.

## Shared motion contract

- All animated primitives use Remotion frames through `useCurrentFrame()`.
- Use `startFrame` and `duration` for entrances or drawing. Frames are local to the nearest Remotion `Sequence`.
- Coordinates for diagram primitives are SVG coordinates. Place them inside an `<svg>` with the intended `viewBox`.
- `src/utils/timing.ts` exports `progress`, `drawProgress`, and `fadeProgress`. `src/utils/random.ts` exports repeatable `seededRandom(seed)` and stateless `seededValue(seed, index)`.
- Do not use wall-clock time, CSS animation, or unseeded randomness.

## Diagram primitives

### Node

**Purpose:** A small system entity or graph vertex.

**Props:** `x`, `y`; optional `size`, `label`, `active`, `accent`, `appearFrame`, `duration`, `pulse`, and `opacity`.

**Example:**

```tsx
<Node x={700} y={400} label="A" active appearFrame={12} pulse />
```

**Visual rules:** Keep nodes smaller than their relationships. Active state adds a quiet gold ring and restrained pulse.

**Good use cases:** Network vertices, states, locations, process steps.

**Don't:** Use Node as a button, badge, or large UI tile.

### AnimatedEdge / Edge / GlowPath

**Purpose:** Draw a straight or curved SVG path over time.

**Props:** `path`, `startFrame`, `duration`, `color`, `width`, `opacity`, `direction`, and optional numeric `progress`. `Edge` aliases `AnimatedEdge`. `GlowPath` also accepts the legacy Task 001/002 `d`, `start`, and `end` props.

**Example:**

```tsx
<AnimatedEdge path="M 420 300 Q 650 180 880 300" startFrame={24} duration={42} />
```

**Visual rules:** Prefer hairline or thin strokes, use gold only for the active relationship, and keep glow local.

**Good use cases:** Network links, causal relations, routes, signal traces.

**Don't:** Draw a full graph when a few meaningful connections explain the idea.

### Arrow

**Purpose:** Show direction along a supplied path or between two points.

**Props:** `path` or `from` and `to`; optional `label`, `labelX`, `labelY`, `startFrame`, `duration`, `color`, `width`, and `opacity`.

**Example:**

```tsx
<Arrow from={{x: 400, y: 300}} to={{x: 800, y: 340}} label="FLOW" startFrame={18} />
```

**Visual rules:** The arrowhead is a small outline mark. Keep labels close to the direction they explain.

**Good use cases:** Process direction, exchange, transport, information flow.

**Don't:** Use a heavy presentation-style arrow or a decorative arrow without meaning.

### FlowParticles

**Purpose:** Move a sparse, repeatable set of points along an SVG path.

**Props:** `path`, `count`, `density`, `speed`, `size`, `color`, `startFrame`, `endFrame`, `direction`, `seed`, and `opacity`.

**Example:**

```tsx
<FlowParticles path="M 420 300 Q 650 180 880 300" count={7} speed={0.9} seed="route-a" />
```

**Visual rules:** Keep counts low and use points to indicate flow, pressure, or exchange. Identical seed and frame produce identical placements.

**Good use cases:** Traffic, energy, money, packets, people, physical signals.

**Don't:** Use particles as ambient decoration or stack a glow filter on every point.

### Relationship

**Purpose:** Connect two entities while distinguishing positive, negative, and neutral relationships.

**Props:** `from`, `to`, optional `state`, `active`, `label`, `startFrame`, `duration`, and `opacity`.

**Example:**

```tsx
<Relationship from={{x: 500, y: 420}} to={{x: 1100, y: 420}} state="positive" active label="SHARED VALUE" />
```

**Visual rules:** Positive uses gold, negative muted red, and neutral cyan. Keep the relationship thinner than an active route.

**Good use cases:** Matching, social ties, game theory, incentives, exchanges.

**Don't:** Turn relationships into a dense web of unlabeled lines.

### HighlightRing

**Purpose:** Quietly focus attention on a point.

**Props:** `x`, `y`, optional `radius`, `startFrame`, `duration`, `color`, `opacity`, and `pulse`.

**Example:**

```tsx
<HighlightRing x={840} y={460} radius={28} startFrame={60} />
```

**Visual rules:** Use one restrained ring with slow breathing motion.

**Good use cases:** A newly active node, a measured value, a term in a formula.

**Don't:** Use flashing, expanding shockwaves, or repeated attention rings.

## Data and knowledge primitives

### Counter

**Purpose:** Animate a measured number from one value to another.

**Props:** `from`, `to`, optional `startFrame`, `duration`, `prefix`, `suffix`, `decimals`, `highlightOnChange`, `color`, and `style`.

**Example:**

```tsx
<Counter from={65} to={80} suffix=" min" startFrame={30} duration={90} highlightOnChange />
```

**Visual rules:** Use tabular numerals and a restrained serif display. Place the value in open space, without a KPI container.

**Good use cases:** Time, distance, probability, cost, observed change.

**Don't:** Add dashboard cards, trend badges, or decorative icons around the number.

### MiniChart

**Purpose:** Reveal one sparse line chart as evidence of a changing variable.

**Props:** `data` (`{x, y}[]`), `xRange`, `yRange`; optional `highlightIndex`, `startFrame`, `duration`, `width`, `height`, `color`, `xLabel`, and `yLabel`.

**Example:**

```tsx
<MiniChart data={[{x: 0, y: 65}, {x: 1, y: 72}, {x: 2, y: 80}]} xRange={[0, 2]} yRange={[60, 85]} highlightIndex={2} />
```

**Visual rules:** Keep axes fine, ticks sparse, and one index highlighted. Use the chart as part of the scene rather than an analytics panel.

**Good use cases:** A trend, before/after comparison, response curve, short time series.

**Don't:** Add legends, grids, multiple series, or dense tick labels by default.

### ProbabilityBar

**Purpose:** Show a probability moving between two percentages.

**Props:** `from`, `to` (0–100), optional `startFrame`, `duration`, `width`, `label`, `suffix`, and `color`.

**Example:**

```tsx
<g transform="translate(420 700)"><ProbabilityBar from={30} to={70} label="CHANCE" /></g>
```

**Visual rules:** Use a single thin scale and a small set of measurement ticks.

**Good use cases:** Bayes, risk, uncertainty, prediction, decision experiments.

**Don't:** Render multiple rows like a settings panel or imply more precision than the source supports.

### Formula

**Purpose:** Place a mathematical or scientific relationship into a scene.

**Props:** `expression` (string or JSX), optional `highlightTerm`, `annotation`, `startFrame`, `duration`, `color`, and `fontSize`.

**Example:**

```tsx
<svg><g transform="translate(360 520)"><Formula expression="P(A | B)" highlightTerm="P(A)" annotation="CONDITIONAL PROBABILITY" /></g></svg>
```

**Visual rules:** Use a readable system serif, isolate one important term, and keep annotation secondary.

**Good use cases:** Equations, inequalities, compact model definitions, physical laws.

**Don't:** Turn the screen into a code block or display a wall of notation.

### Timeline

**Purpose:** Reveal ordered events across time without wrapping each event in a card.

**Props:** `events` (`{year, label, detail?}[]`); optional `startFrame`, `duration`, numeric `progress`, `orientation`, `width`, `height`, and `accent`.

**Example:**

```tsx
<Timeline events={[{year: 1968, label: 'QUESTION'}, {year: 1990, label: 'EVIDENCE'}]} startFrame={20} duration={90} />
```

**Visual rules:** Let a fine line carry chronology; alternate short labels for a horizontal timeline.

**Good use cases:** Discoveries, economic events, model history, causal sequences.

**Don't:** Use timeline events as a row of cards or force long paragraphs into labels.

## Entities and annotation

### AgentToken

**Purpose:** A minimal abstract human mark for a participant in a model.

**Props:** `x`, `y`; optional `label`, `accent`, `state`, `appearFrame`, `duration`, `highlight`, `opacity`, and `scale`.

**Example:**

```tsx
<AgentToken x={520} y={480} label="BUYER" state="active" />
```

**Visual rules:** Use a simple head-and-shoulder silhouette with no facial details. Differentiate participants through labels and state.

**Good use cases:** Buyers, sellers, players, students, decision-makers.

**Don't:** Use emoji, stock icons, copied character art, or a full character animation system.

### VehicleToken

**Purpose:** A small top-down moving object for traffic or logistics diagrams.

**Props:** `x`, `y`; optional `rotation`, `color`, `startFrame`, `duration`, `scale`, `opacity`, and `label`.

**Example:**

```tsx
<VehicleToken x={840} y={620} rotation={90} label="A" />
```

**Visual rules:** Keep the vehicle abstract and small. The scene controls position from frame values.

**Good use cases:** Traffic, routing, logistics, simple movement through a network.

**Don't:** Draw a detailed car or use it as a standalone decorative icon.

### Label

**Purpose:** Render a quiet technical or editorial label at an SVG coordinate.

**Props:** `x`, `y`, `children`; optional `color`, `startFrame`, `duration`, `anchor`, and `size`.

**Example:**

```tsx
<Label x={700} y={420}>NEW PATH</Label>
```

**Visual rules:** Keep labels concise, sparse, and close to the mark they describe.

**Good use cases:** Units, stages, states, short identifiers.

**Don't:** Use labels for paragraphs or fill every empty part of the frame.

### Callout

**Purpose:** Tie a short annotation to a precise point with a fine leader line.

**Props:** `x`, `y`, `anchorX`, `anchorY`, `label`; optional `detail`, `color`, `startFrame`, `duration`, and `align`.

**Example:**

```tsx
<Callout x={1120} y={340} anchorX={980} anchorY={420} label="+1 ROAD" detail="new connection" />
```

**Visual rules:** Use one line and one or two brief text lines. Leave room around both anchor and copy.

**Good use cases:** Measurements, assumptions, exceptions, new variables.

**Don't:** Make a speech bubble, tooltip, rounded panel, or floating UI card.
