# Task 005 — Episode JSON → Video

## Goal

Let an author create a new English knowledge video by editing one JSON file, then validate and render it through the existing Remotion Scene Engine. The authoring contract fixes output at 1920×1080, 30 FPS and English copy. No API keys, LLM, search, TTS, audio, or YouTube services are required.

## Architecture

`episode.json → Zod structure validation → semantic reference/timeline checks → seconds-to-frames normalization → EpisodeVideo → SceneTimeline/SceneRenderer → silent H.264 MP4`

`loadEpisode(path)` performs Node-side read, parse, validate and normalization before Remotion bundles the episode. React rendering receives normalized props and performs no filesystem reads. The generic `EpisodeVideo` composition uses Remotion `calculateMetadata` to derive its dimensions, FPS and duration. Existing Task001–004 compositions remain in the Studio and render independently.

The nine Task004 scene types are retained. `simulation` now has a `networkFlow` mode for the Braess demo and a reusable `bidding` mode using the same scene registration and existing animated primitives. Shared hook/setup/reveal scenes can show participant relationships; comparison, explanation and ending can render without a road network. No story-specific React scene was added. `task004Demo.ts` remains intact except for explicitly declaring its existing simulation mode.

## Schema and validation

`src/episode/schema.ts` is a strict Zod 4 discriminated union for all scene types and both simulation modes. Types are inferred from the schema. Unknown fields are rejected; unsupported schema versions, duplicates, missing network/node/edge/route/bidder references, invalid overlap, and durations that round below one frame fail before rendering. Time normalization consistently uses `Math.round(seconds * fps)`. The omitted overlap uses the engine's existing 34-frame default.

Errors include the JSON file and field path, for example `episodes/foo.json: scenes[4].content.networkId`. SVG path data is limited to geometry characters; JSON cannot supply CSS, HTML, JSX, scripts, URLs or filesystem references. `docs/episode.schema.json` is generated from the runtime schema.

## CLI

```sh
npm install
npm run dev
npm run typecheck
npm run validate:episode -- episodes/braess-paradox.json
npm run validate:episodes
npm run test:episodes
npm run render:episode -- episodes/braess-paradox.json
npm run render:episode -- episodes/dollar-auction.json
```

`npm run validate:episodes` checks every `episodes/*.json`. `npm run schema:episode` regenerates the JSON Schema. A render writes `output/<input-basename>.mp4`.

## Examples

- `episodes/braess-paradox.json`: migrated Task004 content, 9 scenes, 1,800 frames / 60 seconds.
- `episodes/dollar-auction.json`: 7 scenes, 1,422 frames / 47.4 seconds, with two bidding agents, bid events, a prize threshold, moving flows, and escalation callout.
- `docs/EPISODE_FORMAT.md`: complete field reference and minimal full example.

## Acceptance and evidence

| Check | Evidence |
| --- | --- |
| Install | `npm install` succeeded; audit reported zero vulnerabilities. npm printed an esbuild install-script allow-list advisory. |
| TypeScript | `npm run typecheck` passed after the final dependency pin. |
| Runtime validation | `npm run validate:episodes` passed for the two permanent examples. |
| Invalid input | `npm run test:episodes` passed 12 cases: missing title, unknown type, negative and sub-frame durations, missing network, duplicate scene IDs, unsupported version, unknown style fields, invalid edge/node refs, invalid bidder refs, overlap rule and rounding. |
| Studio registry | `npm run dev -- --port=3006` started. `npx remotion compositions src/index.ts` listed Task001Foundation, Task002VisualSystem, Task003ComponentGallery, Task004SceneEngine, and EpisodeVideo. EpisodeVideo is 1920×1080, 30 FPS, 1,800 frames for the Braess preview. |
| Task001–004 regressions | All four `npm run render:task00N` commands exited successfully; output sizes: 1.6 MB, 5.6 MB, 4.7 MB and 7.2 MB respectively. |
| Braess JSON render | `npm run render:episode -- episodes/braess-paradox.json` succeeded. ffprobe: 1920×1080, 30/1 FPS, 1,800 frames, 60 seconds. |
| Dollar Auction JSON render | `npm run render:episode -- episodes/dollar-auction.json` succeeded. ffprobe: 1920×1080, 30/1 FPS, 1,422 frames, 47.4 seconds. |
| JSON-only experiment | Copied Dollar Auction to `episodes/test-variant.json`; changed its title, hook copy, one duration, final bid/value, and reveal/explanation order. Validation and render passed at 1,482 frames / 49.4 seconds. SHA-256 of all 77 TypeScript files under `src/` and `scripts/` matched before and after, confirming no TS/TSX authoring change. The automatic approval reviewer rejected deletion of the exact temporary JSON and MP4 paths; both remain local and are excluded from the commit. |
| Schema artifact | `npm run schema:episode` generated `docs/episode.schema.json`. |
| Git hygiene | `git diff --check` passed. Outputs are ignored by `.gitignore`; stash `pre-task005 cinematic-background local change` contains only the user's pre-existing change and must remain unapplied. |

### Remaining cleanup / delivery status

The Task 005 implementation and required renders passed. Automatic approval review rejected these two explicit cleanup commands with `blocked by policy`: `Remove-Item -LiteralPath 'D:\short-vedios-making\episodes\test-variant.json' -Force` and the equivalent command for `D:\short-vedios-making\output\test-variant.mp4`. The temporary files are not part of the commit. The episode validator still scans the temporary JSON while it remains in the working tree.

## Files

- `src/episode/`: schema, loader, normalizer, semantic validation and tests.
- `src/compositions/EpisodeVideo.tsx`, `src/Root.tsx`: generic dynamic composition and Studio preview.
- `src/engine/scenes/BiddingSimulation.tsx`, `ParticipantsStage.tsx`, shared scene adaptations.
- `episodes/*.json`, `scripts/*.ts`, `docs/EPISODE_FORMAT.md`, `docs/episode.schema.json`.
- `README.md`, `docs/SCENE_ENGINE.md`, `package.json`, `package-lock.json`, `tsconfig.json`.
