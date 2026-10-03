# Task 001 — Foundation

## Goal

Establish the deterministic React, TypeScript, and Remotion foundation and a 20-second cinematic visual-language demo for Vibe Knowledge Video Engine.

## Requirements

- Composition `Task001Foundation`: 1920×1080, 30 FPS, 600 frames (20 seconds).
- English-only on-screen text. No TTS, voice-over, music, audio processing, API keys, LLM, search, image generation, database, or YouTube API.
- Dark cinematic background, deterministic restrained particles, hook, animated abstract network, increased congestion after a new edge appears, reveal, and exit.
- Foundation primitives: cinematic background, deterministic particle field, SVG glow path, text reveal, and lower-third subtitle.
- Remotion Studio, typecheck, and MP4 render scripts; README and reproducible evidence.

## Implementation

The entry point registers one `Task001Foundation` composition. `vibeTheme` owns the visual palette, typography fallbacks, safe areas, and glow tokens. Scene animation is derived from Remotion frame values; particle positions come from a fixed integer sequence. Four base links illuminate progressively; a fifth link appears after frame 282 with denser, faster traffic and a restrained congestion pulse. There are no audio tracks or external services.

## Acceptance Criteria

- [x] `npm install` succeeds.
- [x] `npm run typecheck` succeeds.
- [x] `npm run dev` starts Remotion Studio and builds `Task001Foundation`.
- [x] Composition is 1920×1080, 30 FPS, 600 frames / 20 seconds.
- [x] Demo contains atmospheric intro, hook, network experiment and added connection, reveal, and branded fade-out.
- [x] No external API, API key, TTS, voice-over, or music is needed.
- [x] `npm run render:task001` succeeds and produces `output/task001-foundation.mp4`.
- [x] Repeated render of frame 330 produces an identical SHA-256.
- [x] Git diff reviewed; dependency folders, previews, and output video are ignored.
- [ ] Commit and push to `main` (record below after completion).

## Evidence

- `npm install` — succeeded; 257 packages installed. npm 11 noted that the optional `esbuild` install script was not approved, but Studio bundling and rendering both succeeded.
- `npm run typecheck` — passed (`tsc --noEmit`, exit code 0).
- `npm run dev` — Remotion Studio started at `http://localhost:3000`; `Task001Foundation` bundled successfully.
- `npm run render:task001` — passed; rendered and encoded all 600 frames to a 1.9 MB H.264 MP4.
- Remotion media metadata — 1920×1080, 30 fps, 20 seconds, H.264, `audioCodec: null`.
- Determinism — two frame-330 still renders both had SHA-256 `B1C9D7A6E7CD3FABA48E39A7D9B7DBA1F5782005C312B6036598350E69770AFB`.
- MP4: `D:\short-vedios-making\output\task001-foundation.mp4` (kept local and excluded from Git by `.gitignore`).
- Commit/push: pending.
