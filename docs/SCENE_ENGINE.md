# Scene Engine

Task 004 turns episode content into a deterministic Remotion composition. Episode copy, scene durations, transitions, network geometry, and route-flow counts live in `src/data/task004Demo.ts`; scene components contain reusable visual behavior.

## Architecture

- `src/engine/sceneTypes.ts` defines the discriminated scene and network types.
- `src/engine/timeline.ts` places scenes sequentially and subtracts each incoming overlap from the overall duration.
- `src/engine/SceneTimeline.tsx` mounts each item in a Remotion `Sequence`, so `useCurrentFrame()` is scene-local.
- `src/engine/sceneRegistry.tsx` maps every scene type to its typed renderer.
- `src/engine/SceneRenderer.tsx` supplies scene context, crossfades, and optional lower-third subtitle.
- `src/engine/SceneShell.tsx` provides one persistent cinematic background and camera move for the episode.
- `src/engine/scenes/` contains the nine scene visual implementations and the shared network stage.

## Scene configuration

Scenes are a typed union. Each item declares a stable `id`, a `type`, `durationInFrames`, optional transition overlap and subtitle, visual intent, and type-specific `content`. The network topology is separately declared once in the episode's `networks` map and referenced by `networkId`, keeping the same diagram continuous across scenes.

Example:

```ts
{
  id: 'reveal',
  type: 'reveal',
  durationInFrames: 204,
  transition: {overlapFrames: 34},
  subtitle: 'More capacity can produce a worse equilibrium.',
  content: {
    networkId: 'braess-network',
    eyebrow: 'THE PARADOX',
    headline: 'THE EXTRA ROAD\nMADE TRAFFIC WORSE.',
    emphasis: 'MADE TRAFFIC WORSE',
  },
}
```

An incoming `overlapFrames` value shifts a scene earlier by that amount and crossfades it against the previous scene. The final timeline duration is the sum of scene durations minus overlaps. The composition checks the result against the episode frame count at module load. Motion and particle seeds are deterministic and driven by Remotion frames; scene animations should not use wall-clock time or unseeded randomness.

## Adding a scene type

1. Add its content type to `sceneTypes.ts` and the `SceneSpec` union.
2. Implement a visual scene in `src/engine/scenes/` using `SceneComponentProps<T>` and frame-based Remotion values.
3. Add the typed factory to `sceneRegistry.tsx` and its exhaustive discriminant branch.
4. Add content in the episode data and verify total timeline length.

Use `Subtitle` for restrained English lower thirds. Scene `subtitle` content fades in and out in the scene's local frame range. It supports one highlighted phrase through the shared subtitle primitive; no word-by-word karaoke motion is used.

## Task 004 composition

`Task004SceneEngine` is 1920×1080, 30 FPS, 1800 frames (60 seconds). Preview in Studio with `npm run dev`, or render to `output/task004-scene-engine.mp4` with `npm run render:task004`.
