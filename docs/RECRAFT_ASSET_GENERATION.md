# Recraft Asset Generation Engine

Task002 decides where illustrated assets belong. Task003 executes only the new Recraft assets explicitly listed in `uniqueRecraftAssets`; it does not call DeepSeek or Tavily, regenerate upstream plans, or render an episode. Task004 will compose the resulting image assets with Remotion's precise diagrams and motion.

```powershell
npm run generate:assets -- --plan generated/paradox-of-choice/asset-plan.json --dry-run
npm run generate:assets -- --plan generated/paradox-of-choice/asset-plan.json
npm run generate:assets -- --plan generated/paradox-of-choice/asset-plan.json --retry-failed
```

Use `--force` to replace an episode-local image. Existing cache files are retained. Use `--allow-high-risk` only when a human has decided to attempt an asset that the plan marks high risk. Dry-run never constructs the Recraft provider and never makes an API request. Normal execution checks the plan's hard budget before a request and keeps successful outputs if a later asset fails.

Style configuration resolves from `RECRAFT_STYLE_ID`, then `.recraft-style.local.json`. The API key is read from `RECRAFT_API_KEY`. Neither secret is written into state, report, manifest, cache key, or preview. Generated PNGs are recorded with `backgroundMode: generated`; this does not imply transparency. PNG alpha is detected from the image data. Every generated asset is marked `needs-human-review` because file checks cannot validate semantic correctness or reliably detect embedded text.

Outputs are written to `assets/generated/<episode-id>/` with stable asset-id filenames, `asset-manifest.json`, and `preview.html`. Deterministic content cache entries go under the ignored `assets/cache/recraft/<reuse-key>/<sha256>.png`. Generation state and report are written below the ignored `generated/<episode-id>/` directory. Cache identity includes reuse key, profile/prompt version inputs, prompt, asset kind, composition, and model family; it excludes credentials and Style ID.

High-risk assets are skipped by default and report a procedural/curated fallback requirement. Explicit `--allow-high-risk` permits a bounded API attempt but does not bypass the semantic human-review status. `--retry-failed` uses the persisted generation state and targets failed asset IDs only. Network errors, 429, and 5xx responses receive at most two retries; semantic results are never automatically regenerated.
