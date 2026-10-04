# Task 006 — DeepSeek Content Director

## Goal

Add an optional topic-to-draft episode generator while keeping Task 005's local validator as the gate before any episode is rendered. This task does not add research, voice-over, TTS, music, or YouTube publishing.

## Architecture

`topic/user sources → ContentBriefSchema → content-director-v1 → EpisodeSchema JSON → local validation/normalization → up to two repairs → saved draft → optional Task005 renderer`

`LLMProvider` is the provider boundary. `DeepSeekProvider` implements it with the OpenAI Node SDK and DeepSeek Responses API. `MockLLMProvider` makes the pipeline tests independent from a paid account. The prompts are versioned Markdown files rather than embedded prompt strings.

## Schema and validation

`ContentBriefSchema` contains the story question, intuition, result, mechanism, metaphor, ending, suggested six-to-twelve-scene flow, and risk flags. The episode stage uses JSON Schema generated from Task 005 `EpisodeSchema`, then the same local `normalizeEpisode()` remains authoritative for strict structural, semantic reference, duration and transition checks. Generated episodes are additionally required to contain six to twelve scenes.

The repair loop has a hard cap of two. API retry is separate: at most two retries for transient timeouts/network issues, HTTP 408/429, or 5xx. Key/model configuration, raw errors, partial JSON, and empty model output are handled before any render.

## CLI

```sh
npm run generate:episode -- --topic "Why can more choices make decisions worse?" --id choice-overload --duration 150 --dry-run
npm run make:episode -- --topic "Why can more choices make decisions worse?" --id choice-overload --duration 150
npm run render:episode -- episodes/generated/choice-overload.json
```

`--brief` and `--facts` accept local user-provided text files. If topic and brief are both set, the brief adds context and topic names the focus. CLI model overrides `DEEPSEEK_MODEL`, which overrides `deepseek-flash`. `--force` is required to replace an existing episode/artifact ID. `--dry-run` saves a validated draft but skips rendering.

## Research and safety

There is no search provider. The content prompt treats topic, brief and facts as user source material, asks the model not to claim independent research, and marks unsupported specific studies, dates, statistics, quotes or real-world facts for verification. `needsResearch` warnings are saved and printed. The draft remains renderable for visual review but is not publication-ready until a human verifies factual claims.

`DEEPSEEK_API_KEY` is read only from the environment. `.env.example` contains blank placeholders; `.env` files remain ignored. Keys and Authorization values are redacted from provider errors. Keys are not sent to prompts, reports, JSON artifacts or logs. Generated artifacts under root `generated/` are ignored; the reviewed episode is saved separately under `episodes/generated/`.

## Acceptance and evidence

| Requirement | Result |
| --- | --- |
| Task001–005 preserved | Existing compositions and Task005 examples/tests remain; Task005 typecheck/tests passed. Braess JSON was rendered after Task006 implementation as regression. |
| DeepSeek Responses API + JSON Schema | Implemented with exact base URL and models `deepseek-flash` / `deepseek-v4-pro`; real request not made because the environment had no key. |
| Provider interface + mock | `LLMProvider`, `DeepSeekProvider`, and fixture-based `MockLLMProvider` implemented. |
| Content brief and prompts | `ContentBriefSchema` plus three versioned prompt files created. |
| Local episode validation | Task 005 `normalizeEpisode()` runs before generated output is declared validated or renderable. |
| Bounded repair and API retry | Two repair attempts; two network retries, covered by tests. |
| CLI, dry-run, force, artifacts | `generate:episode`, `make:episode`, no-overwrite check, report and artifact output implemented and tested through mock service/parser paths. |
| Research warnings | Risk flags are persisted and printed; tests check flagged claims. No research is performed. |
| API key handling | Environment-only config, redaction, missing-key test and CLI check verified. `.env` and `.env.*` are ignored, with `.env.example` allowed. |
| Dependencies | `npm install` passed; 0 vulnerabilities. npm warned that esbuild's install script is not on its allow-list. |
| Typecheck | `npm run typecheck` passed. |
| Tests | `npm test`: 22 passed, 0 failed. No test called a live API. |
| Task005 examples | `npm run validate:episodes` passed. The user-requested temporary `test-variant.json` remains from Task005 and is not changed by this task. |
| Braess render | `npm run render:episode -- episodes/braess-paradox.json` was run as Task005 regression after Task006 source changes. |
| Real API smoke | Blocked by missing `DEEPSEEK_API_KEY` (checked without printing any secret). No live request, generated AI episode, or AI render is claimed. |
| stash/worktree | Stash `pre-task005 cinematic-background local change` remains; existing `episodes/test-variant.json` stays unmodified and uncommitted. |

## Files

- `src/ai/`: ContentBrief schema, provider abstraction, DeepSeek config/client, mock provider and generator pipeline.
- `scripts/`: generate, make and shared JSON episode render CLI.
- `prompts/`: content, episode and bounded repair prompts plus visual style guide.
- `tests/fixtures/`, `tests/generation.test.ts`: offline pipeline fixtures/tests.
- `.env.example`, `.gitignore`, `README.md`, `docs/AI_CONTENT_PIPELINE.md`, `package.json`.

## Remaining real-world check

Set `DEEPSEEK_API_KEY` in the shell and run the documented 60-second topic smoke command. A real response and render have intentionally not been fabricated or represented as complete.
