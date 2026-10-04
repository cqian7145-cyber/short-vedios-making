# Research Pipeline — Task 007

Research is an explicit pre-generation stage. `ResearchProvider` separates Tavily from offline fixtures. Production credentials are read from `process.env.TAVILY_API_KEY`; tests use `MockResearchProvider` and never spend API credits.

## Flow and bounds

```text
topic + initial ContentBrief + risk flags
  → DeepSeek Research Query Planner (3–8 targeted queries)
  → ResearchProvider.search (at most 5 results per query)
  → canonical URL deduplication and source quality ordering
  → DeepSeek Fact Assessor over short snippets only
  → local source-link and verification policy
  → research/<episode-id>/ Fact Pack artifacts
```

`MAX_RESEARCH_QUERIES`, `MAX_RESULTS_PER_QUERY`, and `DEFAULT_MAX_SOURCES` live in `src/research/config.ts`. The default cap is 20 unique sources; `--max-sources` accepts 3–40. Search responses are reduced to title, URL, domain, evidence snippet, optional publication date, tier, and retrieval time. Page HTML is never stored.

## Source quality and verification

Tier A identifies known primary, academic, university, government, and official institution domains. Tier B identifies reputable reference works and established journalism. Other sources are Tier C. Tier C results may help discover terminology but are not sufficient to verify a factual claim. A claim marked verified/high must cite one Tier A source or two independent Tier A/B domains. The local policy can downgrade a model assessment; it never upgrades an unverified claim. URLs are canonicalized and duplicate tracking variants are removed.

Claim assessments are attached to exact source IDs. An omitted assessment remains unverified. `publicationReady` is false when any key claim is unverified or contradicted. A partially supported claim stays visible as an uncertainty and may require human judgment. Fact Pack creation does not stop a draft render.

## Prompt injection boundary

Topics, source titles, snippets, URLs, and risk-flag text are untrusted data. Prompts explicitly prohibit following instructions found in web content. The model receives only bounded snippets rather than fetched pages. The Fact Assessor is asked to use only source IDs in the supplied evidence, and local validation removes invented IDs.

## Artifacts

`research/<episode-id>/` contains `research-plan.json`, `sources.json`, `claims.json`, `fact-pack.json`, `research-report.json`, `sources.md`, and the initial `content-brief.json`. The directory is git-ignored by default; selected reviewed examples can be exported deliberately after secret checks.

## Commands

```powershell
$env:TAVILY_API_KEY="your-key"
$env:DEEPSEEK_API_KEY="your-key"
npm run research:episode -- --topic "Why can more choices make decisions worse?" --id paradox-of-choice --provider tavily --max-sources 20
npm run generate:verified -- --topic "Why can more choices make decisions worse?" --id paradox-of-choice --duration 150
```

The research CLI uses Tavily only when explicitly invoked. `npm test` uses fixtures and mocks. `generate:verified` creates an initial brief, research plan and Fact Pack, then generates a validated draft and capability-aware VisualPlan from verified claims and safe conceptual claims; uncertain and contradicted claims are excluded from generation prompts. Research readiness is reported separately from render permission. This command does not render or upload a video.
