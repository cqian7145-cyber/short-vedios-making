# AI Content Pipeline — Task 006

Task 006 adds an optional drafting pipeline:

```text
topic + user brief/facts
    → Content Director → ContentBrief JSON → local validation → at most two brief repairs
    → Episode Director → Episode JSON → Task 005 local validation
    → at most two validation repairs → validated draft episode
    → optional Remotion render
```

DeepSeek is a content director. It receives no search tool and must not claim that it researched or verified information. `docs/VISUAL_LANGUAGE.md`, the prompt files, and the Task 005 Episode schema constrain the visual language and output vocabulary. It cannot generate TSX or CSS.

## Provider and structured output

`DeepSeekProvider` implements the small `LLMProvider.generateStructured()` interface. It calls the official Responses API through the OpenAI JavaScript SDK with base URL `https://api.deepseek.com`, `text.format.type = "json_schema"`, and the runtime Zod schema converted with `z.toJSONSchema`. The brief schema and Task 005 `EpisodeSchema` remain the source definitions. The returned text is parsed locally even when the server is asked for structured output.

The default model is `deepseek-flash`; `deepseek-v4-pro` is also accepted. Model selection is `--model` → `DEEPSEEK_MODEL` → default. The API key is read only from `process.env.DEEPSEEK_API_KEY`. The Responses client has a 60-second timeout and has built-in retries disabled; the provider retries only transient timeout/network, 408, 429, or 5xx failures, with two retries and short bounded backoff. Authentication and other client errors fail immediately. Error text redacts the configured key and authorization values.

DeepSeek documents the Responses API and JSON Schema output in its [Responses API guide](https://api-docs.deepseek.com/guides/responses_api/) and [Responses endpoint reference](https://api-docs.deepseek.com/api/create-response/). The [official OpenAI Node SDK](https://github.com/openai/openai-node) provides the compatible `responses.create()` client used here. Runtime Episode validation remains authoritative, since JSON Schema output alone does not check references or timeline meaning.

## Content stages and research boundary

The first structured request returns `ContentBriefSchema`: topic, central question, usual intuition, counterintuitive result, mechanism, visual metaphor, ending insight, six to twelve suggested scenes, and research risk flags. `content-director-v1` creates this concept plan only; it does not return an episode. The result is validated locally. On validation failure, concise field errors are sent with `repair-content-brief-v1` for at most two repair attempts; the brief is validated again each time. The schema limits remain authoritative. The director prompt asks for a visual metaphor of 250 characters or fewer where possible and never over 400, concise field copy, one short mechanism idea per item, and no paragraph-length values.

The second request receives the brief and the strict Task 005 Episode JSON Schema. `episode-director-v1` maps the plan to six to twelve existing scenes. A local conversion pins the requested episode ID and adds English/topic metadata, then `normalizeEpisode()` runs the actual Task 005 schema, reference and duration checks. Unsupported scene types and references do not reach rendering.

User-provided `--brief` and `--facts` are supplied as source material, not privileged instructions. With both `--topic` and `--brief`, the brief supplies context and the topic specifies the focus. No browser, search API, web fetch, papers, or other research source is used by this code. Specific dates, studies, quotations, named events and statistics without user-supplied evidence are marked with `needsResearch: true`. The CLI prints a publication warning; it still allows a draft and test render. Every generated episode is a draft until a person verifies its claims. Task 007 will add researched fact packs.

There is no narration field, TTS, voice-over, audio, music, or YouTube upload in this pipeline. The model returns concise English visual copy only.

## Repair, files, duration, and overwrite safety

If brief JSON fails parsing or `ContentBriefSchema`, `repair-content-brief-v1` receives the current output and concise local validation errors. It is called at most twice; exhaustion exits nonzero and writes a failed report without starting Episode generation. If episode JSON fails parsing, Task 005 structure validation, reference validation, or the six-to-twelve scene-count check, `repair-episode-v1` receives the original output and the latest concise local error. It is called at most twice. Each result is revalidated. If it still fails, the command exits nonzero and writes a failed report; it never enters an unbounded repair loop.

For `--id choice-overload`, generation saves:

- `generated/choice-overload/content-brief.json`
- `generated/choice-overload/episode.raw.json`
- `generated/choice-overload/episode.validated.json`
- `generated/choice-overload/generation-report.json`
- `episodes/generated/choice-overload.json`

The report records model and prompt versions, target and actual normalized duration, scene count, risk status, and token usage when the API returns it. `briefValidationAttempts` and `briefRepairAttempts` count only ContentBrief validation/repairs; the existing `validationAttempts` and `repairAttempts` count only Episode validation/repairs. It never contains API keys or Authorization headers. `generated/` is local and ignored by Git; episodes explicitly generated for review can be committed separately after key/secret checks.

The default target is 150 seconds. `--duration` accepts 30–600 seconds for shorter integration drafts as well as long episodes. The measured timeline includes scene overlaps; the CLI warns when it differs from the target by more than 15 seconds. The output is not silently stretched to fit.

Before any provider call, the generator checks whether either the per-ID artifacts directory or final episode already exists. If either exists, it refuses to overwrite unless `--force` is passed. `--force` replaces those named files, but does not delete the directory.

Generation is nondeterministic. Once `episode.validated.json` is saved, rendering is the deterministic Task 005 operation over that fixed JSON. `--dry-run` generates and validates all artifacts without calling the renderer; `make:episode` generates, validates, reports research risks and renders unless `--dry-run` is supplied.

## Configure and run

Windows PowerShell:

```powershell
$env:DEEPSEEK_API_KEY="your-key"
$env:DEEPSEEK_MODEL="deepseek-flash"
npm run generate:episode -- --topic "Why can more choices make decisions worse?" --id choice-overload --duration 150 --dry-run
npm run render:episode -- episodes/generated/choice-overload.json
npm run make:episode -- --topic "Why can more choices make decisions worse?" --id choice-overload --duration 150
```

Useful flags are `--topic`, `--brief`, `--facts`, `--id`, `--duration`, `--model`, `--dry-run`, and `--force`. An ID can be derived from a topic if omitted. Pass `--help` to either command for usage.

## Test without a paid API call

```sh
npm run typecheck
npm test
npm run test:episodes
npm run test:ai
```

The `MockLLMProvider` reads `tests/fixtures/` and checks successful generation, ContentBrief repair after an overlong field, its two-repair cap and independent counters, episode validation/repair, overwrite refusal/`--force`, key/model configuration, bounded network retry and credential redaction. These tests do not call DeepSeek. The real API smoke test runs only when a key is present and the user explicitly runs generation; no real request or paid test is made by these unit tests.
