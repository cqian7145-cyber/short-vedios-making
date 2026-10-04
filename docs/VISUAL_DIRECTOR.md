# Visual Director — Task 007

The Visual Director maps episode meaning to a visual grammar. It writes a `VisualPlan`, not React, CSS, or a new story scene type. Episode schema v1 stays backward-compatible: plans refer to existing scenes by `sceneId` and live in `generated/<id>/visual-plan.json`.

## Visual archetypes

The twelve allowed primary/secondary archetypes are `network`, `agents`, `physical_system`, `geometric`, `probability`, `data_curve`, `timeline_archive`, `object_world`, `process_flow`, `field_wave`, `scale_comparison`, and `spatial_map`. These are render modes; existing semantic scene types such as `simulation` and `explanation` remain unchanged.

`VisualDirectorSchema`/`VisualPlanSchema` describe an episode archetype, persistent motif, signature moment, and a scene plan for every existing Episode scene. Scene plans include subject, motion idea, camera intent, layout, continuity, existing primitive reuse, capability requirements, optional fallback, and whether the scene is text-dominant. Strict schemas reject implementation details such as font size, hex colors, CSS, and blur values.

## Capability registry

`src/visual/visualCapabilities.ts` lists the primitives available in the current engine. Network, agents, geometric, probability, data curve, archive timeline, process flow, and scale comparison have supported primitive paths. Physical systems, object worlds, fields/waves, and spatial maps are limited and should name a supported fallback. The planner must not assume full 3D, fluid simulation, or an unimplemented renderer.

## Diversity QA heuristic

The report includes unique primary archetypes, longest repeated run, network ratio, text-dominant ratio, signature-moment presence, warnings, and a 0–100 heuristic score. For episodes at least 60 seconds, fewer than three archetypes warns. Near 150 seconds, four to six is the target. A run longer than two scenes warns without explicit continuity reasoning. Network scenes above half and text-dominant scenes above 60% warn. A signature moment must be a concrete concept-specific event rather than a brighter network node. The score is an editorial QA aid, not a scientific measurement.

## Paradox of choice review focus

The current `paradox-of-choice` smoke draft risks repeating a node-and-edge representation, a left-aligned editorial headline, a centered network diagram, similar camera drift, and the same dark empty layout. Task007 keeps the channel's restrained dark identity but asks the Visual Director to select concept-specific worlds. For this topic, plausible candidates include an object-world door motif, branching decision geometry, agents comparing options, and a data-curve or scale-comparison scene. These are candidates, not a claim about a live model plan until one is generated and reviewed.

## Commands

```powershell
npm run plan:visuals -- --episode episodes/generated/paradox-of-choice.json --facts research/paradox-of-choice/fact-pack.json
```

Outputs are `generated/paradox-of-choice/visual-plan.json` and `generated/paradox-of-choice/visual-diversity-report.json`. Canva is not integrated; external assets default to `none`.

## Task 008 rendering handoff

The factory validates and reuses a saved VisualPlan against the exact Episode scene IDs, resolves each requested archetype to a renderer capability and semantic layout, and records any fallback in `factory-report.json`. Any measurement-driven renderer uses values already present in the Episode; the factory does not invent data. The quality gate may request one bounded VisualPlan repair if a production-length episode misses a release requirement. Task007's structural repair counter and Task008's visual QA repair counter are separate. Remotion receives the resolved strategy together with the saved Episode; no research or LLM provider is called during rendering.
